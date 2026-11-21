package com.itstudy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 积分一致性集成测试：真实 Spring 上下文 + 真实 MySQL（itstudy_test）。
 * 覆盖：首次发布 +5、编辑不加分、回答 +3 与同题去重、兑换扣分幂等、
 * 积分不足不留兑换记录、未兑换不能下载、游客写操作被拦。
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PointsFlowIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private long sectionId;
    private long resourceId;

    /** 从种子数据解析实际主键，避免测试依赖固定自增 id。 */
    @BeforeEach
    void resolveSeedIds() {
        sectionId = jdbcTemplate.queryForObject("SELECT id FROM section ORDER BY id LIMIT 1", Long.class);
        resourceId = jdbcTemplate.queryForObject(
                "SELECT id FROM resource WHERE points = 5 ORDER BY id LIMIT 1", Long.class);
    }

    private static String unique(String prefix) {
        return prefix + (System.nanoTime() % 1_000_000_000L);
    }

    private MockHttpSession register(String username) throws Exception {
        MvcResult result = mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"pass1234\",\"nickname\":\"" + username + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private int balance(MockHttpSession session) throws Exception {
        MvcResult result = mvc.perform(get("/api/points").session(session))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return node.get("balance").asInt();
    }

    private JsonNode body(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    @Test
    void publishAwardsFiveOnceAndEditingKeepsBalance() throws Exception {
        MockHttpSession session = register(unique("pub"));

        MvcResult created = mvc.perform(post("/api/articles")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Spring MVC 请求流程测试\",\"sectionId\":" + sectionId + ",\"contentMd\":\"## 正文\\n\\nDispatcherServlet 负责分发。\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode createdBody = body(created);
        long articleId = createdBody.get("id").asLong();
        assertThat(createdBody.get("pointsDelta").asInt()).isEqualTo(5);
        assertThat(balance(session)).isEqualTo(5);

        mvc.perform(put("/api/articles/" + articleId)
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Spring MVC 请求流程测试（修订）\",\"sectionId\":" + sectionId + ",\"contentMd\":\"改过的正文\"}"))
                .andExpect(status().isOk());
        assertThat(balance(session)).isEqualTo(5);
    }

    @Test
    void answerAwardsThreeOnceAndDuplicateIsRejected() throws Exception {
        MockHttpSession asker = register(unique("ask"));
        MockHttpSession answerer = register(unique("ans"));

        MvcResult asked = mvc.perform(post("/api/questions")
                        .session(asker)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"MyBatis 动态 SQL 为什么没生效\",\"sectionId\":" + sectionId + ",\"contentMd\":\"if 判断字段为 null。\"}"))
                .andExpect(status().isOk())
                .andReturn();
        long questionId = body(asked).get("id").asLong();

        mvc.perform(post("/api/questions/" + questionId + "/answers")
                        .session(answerer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"contentMd\":\"检查 test 表达式里的字符串比较。\"}"))
                .andExpect(status().isCreated());
        assertThat(balance(answerer)).isEqualTo(3);

        MvcResult duplicate = mvc.perform(post("/api/questions/" + questionId + "/answers")
                        .session(answerer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"contentMd\":\"再答一次\"}"))
                .andExpect(status().isConflict())
                .andReturn();
        assertThat(body(duplicate).get("code").asText()).isEqualTo("DUPLICATE_ANSWER");
        assertThat(balance(answerer)).isEqualTo(3);
    }

    @Test
    void exchangeDeductsOnceAndGuardsDownload() throws Exception {
        MockHttpSession session = register(unique("ex"));

        MvcResult poor = mvc.perform(post("/api/resources/" + resourceId + "//exchange").session(session))
                .andExpect(status().isBadRequest())
                .andReturn();
        assertThat(body(poor).get("code").asText()).isEqualTo("POINTS_NOT_ENOUGH");

        mvc.perform(post("/api/articles")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"兑换测试文章\",\"sectionId\":" + sectionId + ",\"contentMd\":\"正文\"}"))
                .andExpect(status().isCreated());
        assertThat(balance(session)).isEqualTo(5);

        mvc.perform(post("/api/resources/" + resourceId + "//exchange").session(session))
                .andExpect(status().isOk());
        assertThat(balance(session)).isEqualTo(0);

        MvcResult again = mvc.perform(post("/api/resources/" + resourceId + "//exchange").session(session))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(body(again).get("alreadyOwned").asBoolean()).isTrue();
        assertThat(balance(session)).isEqualTo(0);

        MvcResult download = mvc.perform(get("/api/resources/" + resourceId + "//download").session(session))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(download.getResponse().getContentAsByteArray().length).isGreaterThan(500);
    }

    @Test
    void guestWriteOperationsAreRejected() throws Exception {
        mvc.perform(post("/api/articles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"游客文章\",\"sectionId\":" + sectionId + ",\"contentMd\":\"x\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/resources/" + resourceId + "//exchange")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/resources/" + resourceId + "//download")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/articles")).andExpect(status().isOk());
    }
}

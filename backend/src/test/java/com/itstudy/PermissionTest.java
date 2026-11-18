package com.itstudy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.itstudy.entity.AppUser;
import com.itstudy.entity.Resource;
import com.itstudy.entity.Section;
import com.itstudy.mapper.ResourceMapper;
import com.itstudy.util.SessionUser;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
@Transactional
class PermissionTest extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private ResourceMapper resourceMapper;

    @Test
    void publishingWithoutLoginIsRejected() throws Exception {
        Section section = createSection();

        mockMvc.perform(post("/api/articles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJson(section.getId(), "未登录发布")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void onlyAuthorCanEditArticle() throws Exception {
        AppUser author = createUser(0);
        AppUser stranger = createUser(0);
        Section section = createSection();

        MvcResult created = mockMvc.perform(post("/api/articles")
                        .session(sessionOf(author.getId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJson(section.getId(), "作者校验")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.pointsDelta").value(5))
                .andReturn();
        JsonNode body = objectMapper.readTree(created.getResponse().getContentAsString(StandardCharsets.UTF_8));
        long articleId = body.get("id").asLong();

        mockMvc.perform(put("/api/articles/" + articleId)
                        .session(sessionOf(stranger.getId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJson(section.getId(), "他人改名")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        mockMvc.perform(put("/api/articles/" + articleId)
                        .session(sessionOf(author.getId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJson(section.getId(), "作者改名")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(articleId));
    }

    @Test
    void downloadRequiresLoginAndExchange() throws Exception {
        AppUser uploader = createUser(0);
        AppUser visitor = createUser(20);
        Section section = createSection();
        Resource resource = createResource(uploader, section);

        mockMvc.perform(get("/api/resources/" + resource.getId() + "/download"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(get("/api/resources/" + resource.getId() + "/download")
                        .session(sessionOf(visitor.getId())))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOT_EXCHANGED"));
    }

    @Test
    void pointsSummaryRequiresLogin() throws Exception {
        mockMvc.perform(get("/api/points"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    private String articleJson(Long sectionId, String title) throws Exception {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("title", title);
        node.put("sectionId", sectionId);
        node.put("summary", "权限测试摘要");
        node.put("contentMd", "权限测试正文");
        return objectMapper.writeValueAsString(node);
    }

    private MockHttpSession sessionOf(Long userId) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionUser.SESSION_KEY, userId);
        return session;
    }

    private Resource createResource(AppUser uploader, Section section) {
        Resource resource = new Resource();
        resource.setSectionId(section.getId());
        resource.setUploaderId(uploader.getId());
        resource.setTitle("权限测试资源");
        resource.setDescription("未兑换时不可下载");
        resource.setFileName("permission.md");
        resource.setFileType("MD");
        resource.setFileSize(512L);
        resource.setPoints(5);
        resource.setDownloadCount(0);
        resource.setCreatedAt(LocalDateTime.now());
        resourceMapper.insert(resource);
        return resource;
    }
}

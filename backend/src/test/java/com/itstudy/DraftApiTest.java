package com.itstudy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itstudy.mapper.FavoriteMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 草稿列表接口、删除文章清理收藏，以及 405/415 的错误契约。
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class DraftApiTest {

    @Autowired
    private MockMvc mvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private FavoriteMapper favoriteMapper;

    private record Account(MockHttpSession session, long userId) {
    }

    private String unique(String prefix) {
        return prefix + (System.nanoTime() % 1_000_000_000L);
    }

    private JsonNode body(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private Account register(String username) throws Exception {
        MvcResult result = mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"pass1234\",\"nickname\":\"" + username + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        return new Account(session, body(result).get("user").get("id").asLong());
    }

    private void saveDraft(MockHttpSession session, String type, String key, String title) throws Exception {
        mvc.perform(put("/api/drafts").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"draftType\":\"" + type + "\",\"draftKey\":\"" + key
                                + "\",\"title\":\"" + title + "\",\"contentMd\":\"正文\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void listsDraftsByAccountAndType() throws Exception {
        Account account = register(unique("draft"));
        saveDraft(account.session(), "article", "new", "新建文章草稿");
        saveDraft(account.session(), "article", "12", "编辑文章草稿");
        saveDraft(account.session(), "question", "new", "问答草稿");

        assertThat(body(mvc.perform(get("/api/drafts").session(account.session()))
                .andExpect(status().isOk()).andReturn()).size()).isEqualTo(3);

        MvcResult articles = mvc.perform(get("/api/drafts").param("draftType", "article").session(account.session()))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(body(articles).size()).isEqualTo(2);

        MvcResult single = mvc.perform(get("/api/drafts")
                        .param("draftType", "article").param("draftKey", "new").session(account.session()))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(body(single).get("title").asText()).isEqualTo("新建文章草稿");
    }

    @Test
    void deletingArticleClearsFavorites() throws Exception {
        Account account = register(unique("del"));
        MvcResult created = mvc.perform(post("/api/articles").session(account.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"待删除文章\",\"sectionId\":1,\"contentMd\":\"正文内容\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        long articleId = body(created).get("id").asLong();

        mvc.perform(post("/api/favorites/toggle").session(account.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"targetType\":\"article\",\"targetId\":" + articleId + "}"))
                .andExpect(status().isOk());
        assertThat(favoriteMapper.selectOne(account.userId(), "article", articleId)).isNotNull();

        mvc.perform(delete("/api/articles/" + articleId).session(account.session()))
                .andExpect(status().isNoContent());
        assertThat(favoriteMapper.selectOne(account.userId(), "article", articleId)).isNull();
    }

    @Test
    void unsupportedMethodAndMediaTypeKeepContract() throws Exception {
        MvcResult method = mvc.perform(delete("/api/sections"))
                .andExpect(status().isMethodNotAllowed())
                .andReturn();
        assertThat(body(method).get("code").asText()).isEqualTo("METHOD_NOT_ALLOWED");

        MvcResult media = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.TEXT_PLAIN).content("x"))
                .andExpect(status().isUnsupportedMediaType())
                .andReturn();
        assertThat(body(media).get("code").asText()).isEqualTo("UNSUPPORTED_MEDIA_TYPE");
    }
}

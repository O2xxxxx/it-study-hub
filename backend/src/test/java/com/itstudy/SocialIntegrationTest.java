package com.itstudy;

import com.itstudy.common.BizException;
import com.itstudy.dto.ArticleForm;
import com.itstudy.dto.LikeForm;
import com.itstudy.dto.LikeResult;
import com.itstudy.dto.UserBrief;
import com.itstudy.entity.AppUser;
import com.itstudy.entity.Section;
import com.itstudy.service.ArticleService;
import com.itstudy.service.FollowService;
import com.itstudy.service.LikeService;
import com.itstudy.util.SessionUser;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
class SocialIntegrationTest extends BaseIntegrationTest {

    @Autowired private LikeService likes;
    @Autowired private FollowService follows;
    @Autowired private ArticleService articles;
    @Autowired private JdbcTemplate db;
    @Autowired private MockMvc mvc;

    @Test
    @Transactional
    void repeatedLikesAndUnlikesUpdateTheDetailOnce() {
        AppUser author = createUser(0);
        AppUser liker = createUser(0);
        long postId = publish(author, createSection());
        var wanted = new LikeForm("article", postId, true);
        assertEquals(new LikeResult(true, 1), likes.toggle(liker.getId(), wanted));
        assertEquals(new LikeResult(true, 1), likes.toggle(liker.getId(), wanted));
        assertTrue(articles.detail(postId, liker.getId()).isLikedByMe());
        assertFalse(articles.detail(postId, null).isLikedByMe());
        assertEquals(1, articles.detail(postId, null).getLikeCount());
        var unwanted = new LikeForm("article", postId, false);
        assertEquals(new LikeResult(false, 0), likes.toggle(liker.getId(), unwanted));
        assertEquals(new LikeResult(false, 0), likes.toggle(liker.getId(), unwanted));
        assertEquals(0, articles.detail(postId, null).getLikeCount());
    }

    @Test
    @Transactional
    void repeatedFollowAndUnfollowKeepBothCounters() {
        AppUser viewer = createUser(0);
        AppUser target = createUser(0);
        assertEquals(1, follows.setFollowing(target.getUsername(), viewer.getId(), true).followerCount());
        assertEquals(1, follows.setFollowing(target.getUsername(), viewer.getId(), true).followerCount());
        assertEquals(1, follows.profile(viewer.getUsername(), viewer.getId()).followingCount());
        assertEquals(0, follows.setFollowing(target.getUsername(), viewer.getId(), false).followerCount());
        assertEquals(0, follows.setFollowing(target.getUsername(), viewer.getId(), false).followerCount());
        assertEquals(0, follows.profile(viewer.getUsername(), viewer.getId()).followingCount());
    }

    @Test
    @Transactional
    void deletedFollowerStillAppearsInTheRelationshipHistory() {
        AppUser viewer = createUser(0);
        AppUser target = createUser(0);
        follows.setFollowing(target.getUsername(), viewer.getId(), true);
        assertEquals(1, appUserMapper.deleteById(viewer.getId()));
        var page = follows.connections(target.getUsername(), true, 1, 10);
        assertEquals(1, page.getTotal());
        assertEquals(List.of(new UserBrief(viewer.getId(), null, "已注销用户", null, true)), page.getItems());
    }

    @Test
    @Transactional
    void anonymousReadsAndMutationPermissions() throws Exception {
        AppUser author = createUser(0);
        mvc.perform(get("/api/users/" + author.getUsername())).andExpect(status().isOk())
                .andExpect(jsonPath("$.followedByMe").value(false))
                .andExpect(jsonPath("$.isSelf").value(false));
        mvc.perform(post("/api/likes/toggle").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"targetType\":\"article\",\"targetId\":1,\"liked\":true}"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
        String follow = "/api/users/" + author.getUsername() + "/follow";
        mvc.perform(post(follow)).andExpect(status().isUnauthorized());
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionUser.SESSION_KEY, author.getId());
        mvc.perform(post(follow).session(session)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        mvc.perform(get("/api/users/" + author.getUsername()).session(session)).andExpect(status().isOk())
                .andExpect(jsonPath("$.isSelf").value(true));
    }

    @Test
    void concurrentLikeRequestsInsertExactlyOneRelationship() throws Exception {
        AppUser author = createUser(0);
        AppUser viewer = createUser(0);
        Section section = createSection();
        long postId = publish(author, section);
        var pool = Executors.newFixedThreadPool(6);
        try {
            CountDownLatch start = new CountDownLatch(1);
            List<Future<LikeResult>> results = new ArrayList<>();
            for (int i = 0; i < 6; i++) {
                results.add(pool.submit(() -> {
                    if (!start.await(5, TimeUnit.SECONDS)) throw new IllegalStateException("start timeout");
                    return likes.toggle(viewer.getId(), new LikeForm("article", postId, true));
                }));
            }
            start.countDown();
            for (Future<LikeResult> result : results) {
                assertEquals(new LikeResult(true, 1), result.get(10, TimeUnit.SECONDS));
            }
            assertEquals(1, db.queryForObject("SELECT COUNT(*) FROM post_like WHERE user_id=? AND target_type='article' AND target_id=?",
                    Integer.class, viewer.getId(), postId));
            assertEquals(1, articles.detail(postId, null).getLikeCount());
        } finally {
            pool.shutdownNow();
            pool.awaitTermination(10, TimeUnit.SECONDS);
            articles.delete(postId, author.getId());
            db.update("DELETE FROM point_log WHERE user_id=?", author.getId());
            sectionMapper.deleteById(section.getId());
            appUserMapper.deleteById(viewer.getId());
            appUserMapper.deleteById(author.getId());
        }
    }

    private long publish(AppUser author, Section section) {
        ArticleForm form = new ArticleForm();
        form.setTitle("测试点赞的文章");
        form.setSectionId(section.getId());
        form.setContentMd("验证社交操作的计数与并发一致性。");
        return articles.publish(author.getId(), form).getId();
    }
}

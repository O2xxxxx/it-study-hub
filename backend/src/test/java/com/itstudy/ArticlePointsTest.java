package com.itstudy;

import com.itstudy.dto.ArticleForm;
import com.itstudy.dto.PublishResult;
import com.itstudy.entity.AppUser;
import com.itstudy.entity.Article;
import com.itstudy.entity.Section;
import com.itstudy.mapper.ArticleMapper;
import com.itstudy.mapper.PointLogMapper;
import com.itstudy.service.ArticleService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Transactional
class ArticlePointsTest extends BaseIntegrationTest {

    @Autowired
    private ArticleService articleService;
    @Autowired
    private ArticleMapper articleMapper;
    @Autowired
    private PointLogMapper pointLogMapper;
    @Autowired
    private DataSource dataSource;

    @Test
    void runsAgainstIsolatedTestDatabase() throws SQLException {
        try (Connection connection = dataSource.getConnection()) {
            assertEquals("itstudy_test", connection.getCatalog());
        }
    }

    @Test
    void firstPublishAwardsPointsButEditDoesNot() {
        AppUser author = createUser(0);
        Section section = createSection();

        PublishResult published = articleService.publish(author.getId(), articleForm(section.getId(), "Spring 事务入门"));
        assertNotNull(published.getId());
        assertEquals(5, published.getPointsDelta().intValue());
        assertEquals(5, published.getBalance());
        assertEquals(5, appUserMapper.selectBalance(author.getId()).intValue());
        assertEquals(1, pointLogMapper.countBusiness(author.getId(), "ARTICLE_PUBLISH", published.getId()));

        Article saved = articleMapper.selectById(published.getId());
        assertNotNull(saved);
        assertTrue(Boolean.TRUE.equals(saved.getRewardGranted()));

        PublishResult updated = articleService.update(published.getId(), author.getId(),
                articleForm(section.getId(), "Spring 事务入门（修订）"));
        assertEquals(0, updated.getPointsDelta().intValue());
        assertEquals(5, updated.getBalance());
        assertEquals(5, appUserMapper.selectBalance(author.getId()).intValue());
        assertEquals(1, pointLogMapper.countBusiness(author.getId(), "ARTICLE_PUBLISH", published.getId()));
        assertEquals(1L, pointLogMapper.countByUser(author.getId()));
        assertEquals("Spring 事务入门（修订）", articleMapper.selectById(published.getId()).getTitle());
    }

    private ArticleForm articleForm(Long sectionId, String title) {
        ArticleForm form = new ArticleForm();
        form.setTitle(title);
        form.setSectionId(sectionId);
        form.setSummary("测试摘要");
        form.setContentMd("正文内容：事务边界与积分奖励。");
        return form;
    }
}

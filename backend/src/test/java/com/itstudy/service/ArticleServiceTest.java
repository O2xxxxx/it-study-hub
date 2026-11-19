package com.itstudy.service;

import com.itstudy.config.PointsProperties;
import com.itstudy.dto.ArticleForm;
import com.itstudy.dto.PublishResult;
import com.itstudy.entity.Article;
import com.itstudy.entity.PointLog;
import com.itstudy.entity.Section;
import com.itstudy.mapper.AppUserMapper;
import com.itstudy.mapper.PostLikeMapper;
import com.itstudy.mapper.ArticleMapper;
import com.itstudy.mapper.FavoriteMapper;
import com.itstudy.mapper.PointLogMapper;
import com.itstudy.mapper.SectionMapper;
import com.itstudy.service.impl.ArticleServiceImpl;
import com.itstudy.util.MarkdownRenderer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ArticleServiceTest {

    private ArticleMapper articleMapper;
    private SectionMapper sectionMapper;
    private AppUserMapper appUserMapper;
    private PointLogMapper pointLogMapper;
    private ArticleServiceImpl articleService;

    @BeforeEach
    void setUp() {
        articleMapper = mock(ArticleMapper.class);
        sectionMapper = mock(SectionMapper.class);
        appUserMapper = mock(AppUserMapper.class);
        pointLogMapper = mock(PointLogMapper.class);
        FavoriteMapper favoriteMapper = mock(FavoriteMapper.class);
        MarkdownRenderer renderer = mock(MarkdownRenderer.class);
        PointsProperties points = new PointsProperties();
        points.setArticlePublish(5);
        points.setAnswerCreate(3);
        articleService = new ArticleServiceImpl(articleMapper, sectionMapper, appUserMapper, org.mockito.Mockito.mock(PostLikeMapper.class),
                pointLogMapper, favoriteMapper, renderer, points);
    }

    private ArticleForm form() {
        ArticleForm form = new ArticleForm();
        form.setTitle("测试文章");
        form.setSectionId(1L);
        form.setContentMd("# 你好");
        return form;
    }

    private Section section() {
        Section section = new Section();
        section.setId(1L);
        section.setCode("java-basics");
        section.setName("Java 基础");
        return section;
    }

    @Test
    @DisplayName("首次发布文章加 5 分，写一条流水并返回最新余额")
    void publishAwardsPointsOnce() {
        when(sectionMapper.selectById(1L)).thenReturn(section());
        when(articleMapper.insert(any(Article.class))).thenAnswer(invocation -> {
            Article article = invocation.getArgument(0);
            article.setId(101L);
            return 1;
        });
        when(pointLogMapper.countBusiness(1L, "ARTICLE_PUBLISH", 101L)).thenReturn(0);
        when(appUserMapper.selectBalance(1L)).thenReturn(15, 20);
        when(appUserMapper.addPoints(1L, 5)).thenReturn(1);

        PublishResult result = articleService.publish(1L, form());

        assertEquals(101L, result.getId());
        assertEquals(5, result.getPointsDelta());
        assertEquals(20, result.getBalance());
        verify(pointLogMapper, times(1)).insert(any(PointLog.class));
        verify(appUserMapper, times(1)).addPoints(1L, 5);
    }

    @Test
    @DisplayName("编辑文章不加分、不写流水")
    void updateDoesNotAwardPoints() {
        Article existing = new Article();
        existing.setId(101L);
        existing.setAuthorId(1L);
        existing.setSectionId(1L);
        existing.setTitle("旧标题");
        existing.setContentMd("旧正文");
        existing.setRewardGranted(Boolean.TRUE);
        existing.setViewCount(3);
        existing.setCreatedAt(LocalDateTime.now());
        when(sectionMapper.selectById(1L)).thenReturn(section());
        when(articleMapper.selectById(101L)).thenReturn(existing);
        when(articleMapper.updateById(any(Article.class))).thenReturn(1);
        when(appUserMapper.selectBalance(1L)).thenReturn(18);

        PublishResult result = articleService.update(101L, 1L, form());

        assertEquals(101L, result.getId());
        assertEquals(0, result.getPointsDelta());
        assertEquals(18, result.getBalance());
        verify(pointLogMapper, never()).insert(any(PointLog.class));
        verify(appUserMapper, never()).addPoints(anyLong(), anyInt());
    }

    @Test
    @DisplayName("同一篇文章重复触发奖励时不重复加分")
    void duplicateRewardIsIgnored() {
        when(sectionMapper.selectById(1L)).thenReturn(section());
        when(articleMapper.insert(any(Article.class))).thenAnswer(invocation -> {
            Article article = invocation.getArgument(0);
            article.setId(102L);
            return 1;
        });
        when(pointLogMapper.countBusiness(1L, "ARTICLE_PUBLISH", 102L)).thenReturn(1);
        when(appUserMapper.selectBalance(1L)).thenReturn(20);

        PublishResult result = articleService.publish(1L, form());

        assertEquals(0, result.getPointsDelta());
        assertEquals(20, result.getBalance());
        verify(pointLogMapper, never()).insert(any(PointLog.class));
        verify(appUserMapper, never()).addPoints(eq(1L), anyInt());
    }
}

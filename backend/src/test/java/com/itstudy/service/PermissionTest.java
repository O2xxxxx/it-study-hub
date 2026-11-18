package com.itstudy.service;

import com.itstudy.common.BizException;
import com.itstudy.config.PointsProperties;
import com.itstudy.dto.ArticleForm;
import com.itstudy.entity.Article;
import com.itstudy.mapper.AppUserMapper;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PermissionTest {

    private ArticleMapper articleMapper;
    private ArticleServiceImpl articleService;

    @BeforeEach
    void setUp() {
        articleMapper = mock(ArticleMapper.class);
        SectionMapper sectionMapper = mock(SectionMapper.class);
        AppUserMapper appUserMapper = mock(AppUserMapper.class);
        PointLogMapper pointLogMapper = mock(PointLogMapper.class);
        FavoriteMapper favoriteMapper = mock(FavoriteMapper.class);
        MarkdownRenderer renderer = mock(MarkdownRenderer.class);
        PointsProperties points = new PointsProperties();
        points.setArticlePublish(5);
        points.setAnswerCreate(3);
        articleService = new ArticleServiceImpl(articleMapper, sectionMapper, appUserMapper,
                pointLogMapper, favoriteMapper, renderer, points);
    }

    private Article articleOfUser1() {
        Article article = new Article();
        article.setId(101L);
        article.setAuthorId(1L);
        article.setSectionId(1L);
        article.setTitle("作者是 teacher 的文章");
        article.setContentMd("# 正文");
        article.setRewardGranted(Boolean.TRUE);
        article.setViewCount(5);
        article.setCreatedAt(LocalDateTime.now());
        return article;
    }

    private ArticleForm form() {
        ArticleForm form = new ArticleForm();
        form.setTitle("被篡改的标题");
        form.setSectionId(1L);
        form.setContentMd("# 被篡改的正文");
        return form;
    }

    @Test
    @DisplayName("非作者编辑文章返回 403 FORBIDDEN")
    void nonAuthorCannotUpdateArticle() {
        when(articleMapper.selectById(101L)).thenReturn(articleOfUser1());

        BizException ex = assertThrows(BizException.class,
                () -> articleService.update(101L, 2L, form()));

        assertEquals("FORBIDDEN", ex.getCode());
        assertEquals(403, ex.getStatus().value());
        verify(articleMapper, never()).updateById(any(Article.class));
    }

    @Test
    @DisplayName("非作者删除文章返回 403 FORBIDDEN")
    void nonAuthorCannotDeleteArticle() {
        when(articleMapper.selectById(101L)).thenReturn(articleOfUser1());

        BizException ex = assertThrows(BizException.class,
                () -> articleService.delete(101L, 2L));

        assertEquals("FORBIDDEN", ex.getCode());
        assertEquals(403, ex.getStatus().value());
        verify(articleMapper, never()).deleteById(any(Article.class));
    }
}

package com.itstudy.service.impl;

import com.itstudy.common.BizException;
import com.itstudy.common.PageResult;
import com.itstudy.dto.ArticleCard;
import com.itstudy.dto.ArticleDetail;
import com.itstudy.dto.ArticleForm;
import com.itstudy.dto.AuthorBrief;
import com.itstudy.dto.PublishResult;
import com.itstudy.dto.SectionBrief;
import com.itstudy.entity.AppUser;
import com.itstudy.entity.Article;
import com.itstudy.entity.Favorite;
import com.itstudy.entity.Section;
import com.itstudy.mapper.AppUserMapper;
import com.itstudy.mapper.PostLikeMapper;
import com.itstudy.mapper.ArticleMapper;
import com.itstudy.mapper.FavoriteMapper;
import com.itstudy.mapper.PointLogMapper;
import com.itstudy.mapper.SectionMapper;
import com.itstudy.config.PointsProperties;
import com.itstudy.service.ArticleService;
import com.itstudy.util.MarkdownRenderer;
import com.itstudy.util.Pages;
import com.itstudy.util.PointAwarder;
import com.itstudy.util.TextUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ArticleServiceImpl implements ArticleService {

    /** 积分流水业务类型（与 schema 注释、演示数据一致）。 */
    public static final String REASON_ARTICLE = "ARTICLE_PUBLISH";

    private final ArticleMapper articleMapper;
    private final SectionMapper sectionMapper;
    private final AppUserMapper appUserMapper;
    private final PostLikeMapper postLikeMapper;
    private final PointLogMapper pointLogMapper;
    private final FavoriteMapper favoriteMapper;
    private final MarkdownRenderer markdownRenderer;
    private final PointsProperties pointsProperties;

    public ArticleServiceImpl(ArticleMapper articleMapper,
                              SectionMapper sectionMapper,
                              AppUserMapper appUserMapper,
                              PostLikeMapper postLikeMapper,
                              PointLogMapper pointLogMapper,
                              FavoriteMapper favoriteMapper,
                              MarkdownRenderer markdownRenderer,
                              PointsProperties pointsProperties) {
        this.articleMapper = articleMapper;
        this.sectionMapper = sectionMapper;
        this.appUserMapper = appUserMapper;
        this.postLikeMapper = postLikeMapper;
        this.pointLogMapper = pointLogMapper;
        this.favoriteMapper = favoriteMapper;
        this.markdownRenderer = markdownRenderer;
        this.pointsProperties = pointsProperties;
    }

    @Override
    public PageResult<ArticleCard> page(String sectionCode, Integer page, Integer size, String sort, Long authorId, Long userId) {
        int p = Pages.page(page);
        int s = Pages.size(size, 10);
        long total = articleMapper.countCards(sectionCode, authorId);
        if (total <= 0) {
            return new PageResult<>(List.of(), p, s, 0);
        }
        String sortKey = sort == null || sort.isBlank() ? "latest" : sort;
        List<ArticleCard> items = articleMapper.selectCards(sectionCode, authorId, sortKey, userId, Pages.offset(p, s), s);
        return new PageResult<>(items, p, s, total);
    }

    @Override
    public ArticleDetail detail(Long id, Long userId) {
        Article article = articleMapper.selectById(id);
        if (article == null) {
            throw BizException.notFound("文章不存在");
        }
        articleMapper.incrementView(id);
        ArticleDetail detail = new ArticleDetail();
        detail.setId(article.getId());
        detail.setTitle(article.getTitle());
        detail.setSummary(article.getSummary());
        detail.setContentMd(article.getContentMd());
        detail.setContentHtml(markdownRenderer.toHtml(article.getContentMd()));
        detail.setRewardGranted(Boolean.TRUE.equals(article.getRewardGranted()));
        detail.setViewCount((article.getViewCount() == null ? 0 : article.getViewCount()) + 1);
        detail.setCreatedAt(article.getCreatedAt());
        detail.setUpdatedAt(article.getUpdatedAt());

        SectionBrief section = new SectionBrief();
        Section sectionEntity = article.getSectionId() == null ? null : sectionMapper.selectById(article.getSectionId());
        if (sectionEntity != null) {
            section.setId(sectionEntity.getId());
            section.setCode(sectionEntity.getCode());
            section.setName(sectionEntity.getName());
            section.setAccent(sectionEntity.getAccent());
        }
        detail.setSection(section);

        AuthorBrief author = new AuthorBrief();
        AppUser authorEntity = article.getAuthorId() == null ? null : appUserMapper.selectById(article.getAuthorId());
        if (authorEntity != null) {
            author.setId(authorEntity.getId());
            author.setUsername(authorEntity.getUsername());
            author.setNickname(authorEntity.getNickname());
            author.setAvatarHue(authorEntity.getAvatarHue());
        }
        detail.setAuthor(author);
        detail.setLikeCount(article.getLikeCount() == null ? 0 : article.getLikeCount());
        detail.setLikedByMe(userId != null && postLikeMapper.existsLike(userId, "article", id));

        detail.setFavorite(isFavorited(userId, id));
        detail.setCanEdit(userId != null && userId.equals(article.getAuthorId()));
        return detail;
    }

    @Override
    @Transactional
    public PublishResult publish(Long userId, ArticleForm form) {
        requireSection(form.getSectionId());
        Article article = new Article();
        article.setSectionId(form.getSectionId());
        article.setAuthorId(userId);
        article.setTitle(form.getTitle().trim());
        article.setSummary(resolveSummary(form));
        article.setContentMd(form.getContentMd());
        article.setRewardGranted(Boolean.TRUE);
        article.setViewCount(0);
        LocalDateTime now = LocalDateTime.now();
        article.setCreatedAt(now);
        article.setUpdatedAt(now);
        articleMapper.insert(article);

        int delta = PointAwarder.award(pointLogMapper, appUserMapper, userId,
                REASON_ARTICLE,
                "发布文章《" + article.getTitle() + "》获得奖励",
                "article",
                article.getId(),
                pointsProperties.getArticlePublish());
        return PublishResult.of(article.getId(), delta, balance(userId));
    }

    @Override
    @Transactional
    public PublishResult update(Long id, Long userId, ArticleForm form) {
        Article article = articleMapper.selectById(id);
        if (article == null) {
            throw BizException.notFound("文章不存在");
        }
        if (userId == null || !userId.equals(article.getAuthorId())) {
            throw BizException.forbidden("只能编辑自己的文章");
        }
        requireSection(form.getSectionId());
        Article patch = new Article();
        patch.setId(id);
        patch.setSectionId(form.getSectionId());
        patch.setTitle(form.getTitle().trim());
        patch.setSummary(resolveSummary(form));
        patch.setContentMd(form.getContentMd());
        patch.setUpdatedAt(LocalDateTime.now());
        articleMapper.updateById(patch);
        return PublishResult.of(id, 0, balance(userId));
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        Article article = articleMapper.selectById(id);
        if (article == null) {
            throw BizException.notFound("文章不存在");
        }
        if (userId == null || !userId.equals(article.getAuthorId())) {
            throw BizException.forbidden("只能删除自己的文章");
        }
        if (articleMapper.deleteById(id) == 1) {
            postLikeMapper.deleteForPost("article", id);
            favoriteMapper.deleteForTarget("article", id);
        }
    }

    private boolean isFavorited(Long userId, Long articleId) {
        if (userId == null) {
            return false;
        }
        Favorite favorite = favoriteMapper.selectOne(userId, "article", articleId);
        return favorite != null;
    }

    private int balance(Long userId) {
        Integer points = appUserMapper.selectBalance(userId);
        return points == null ? 0 : points;
    }

    private void requireSection(Long sectionId) {
        if (sectionId == null || sectionMapper.selectById(sectionId) == null) {
            throw BizException.validation("版块不存在");
        }
    }

    private String resolveSummary(ArticleForm form) {
        if (form.getSummary() != null && !form.getSummary().isBlank()) {
            return form.getSummary().trim();
        }
        return TextUtil.summarize(form.getContentMd(), 120);
    }
}

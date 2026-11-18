package com.itstudy.service.impl;

import com.itstudy.common.BizException;
import com.itstudy.dto.FavoriteGroups;
import com.itstudy.dto.FavoriteToggleForm;
import com.itstudy.dto.FavoriteToggleResult;
import com.itstudy.entity.Favorite;
import com.itstudy.mapper.ArticleMapper;
import com.itstudy.mapper.FavoriteMapper;
import com.itstudy.mapper.QuestionMapper;
import com.itstudy.mapper.ResourceMapper;
import com.itstudy.service.FavoriteService;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class FavoriteServiceImpl implements FavoriteService {

    private static final List<String> TYPES = List.of("article", "question", "resource");

    private final FavoriteMapper favoriteMapper;
    private final ArticleMapper articleMapper;
    private final QuestionMapper questionMapper;
    private final ResourceMapper resourceMapper;

    public FavoriteServiceImpl(FavoriteMapper favoriteMapper,
                               ArticleMapper articleMapper,
                               QuestionMapper questionMapper,
                               ResourceMapper resourceMapper) {
        this.favoriteMapper = favoriteMapper;
        this.articleMapper = articleMapper;
        this.questionMapper = questionMapper;
        this.resourceMapper = resourceMapper;
    }

    @Override
    public FavoriteGroups groups(Long userId, String type) {
        String filter = type == null || type.isBlank() ? "all" : type.trim().toLowerCase(Locale.ROOT);
        if (!"all".equals(filter) && !TYPES.contains(filter)) {
            throw BizException.validation("type 只能是 article、question、resource");
        }
        FavoriteGroups groups = new FavoriteGroups();
        if ("all".equals(filter) || "article".equals(filter)) {
            groups.setArticle(favoriteMapper.selectFavoriteArticles(userId));
        }
        if ("all".equals(filter) || "question".equals(filter)) {
            groups.setQuestion(favoriteMapper.selectFavoriteQuestions(userId));
        }
        if ("all".equals(filter) || "resource".equals(filter)) {
            groups.setResource(favoriteMapper.selectFavoriteResources(userId));
        }
        return groups;
    }

    @Override
    @Transactional
    public FavoriteToggleResult toggle(Long userId, FavoriteToggleForm form) {
        String targetType = form.getTargetType() == null ? "" : form.getTargetType().trim().toLowerCase(Locale.ROOT);
        if (!TYPES.contains(targetType)) {
            throw BizException.validation("targetType 只能是 article、question、resource");
        }
        requireTarget(targetType, form.getTargetId());
        Favorite exist = favoriteMapper.selectOne(userId, targetType, form.getTargetId());
        if (exist != null) {
            favoriteMapper.deleteOne(userId, targetType, form.getTargetId());
            return FavoriteToggleResult.of(false, favoriteMapper.countByUser(userId));
        }
        Favorite favorite = new Favorite();
        favorite.setUserId(userId);
        favorite.setTargetType(targetType);
        favorite.setTargetId(form.getTargetId());
        favorite.setCreatedAt(LocalDateTime.now());
        try {
            favoriteMapper.insert(favorite);
        } catch (DuplicateKeyException ignored) {
            // 幂等：并发收藏视为已收藏
        }
        return FavoriteToggleResult.of(true, favoriteMapper.countByUser(userId));
    }

    private void requireTarget(String targetType, Long targetId) {
        Object target = switch (targetType) {
            case "article" -> articleMapper.selectById(targetId);
            case "question" -> questionMapper.selectById(targetId);
            default -> resourceMapper.selectById(targetId);
        };
        if (target == null) {
            throw BizException.notFound("收藏目标不存在");
        }
    }
}

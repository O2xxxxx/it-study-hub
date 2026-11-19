package com.itstudy.service.impl;

import com.itstudy.common.BizException;
import com.itstudy.dto.LikeForm;
import com.itstudy.dto.LikeResult;
import com.itstudy.entity.PostLike;
import com.itstudy.mapper.AppUserMapper;
import com.itstudy.mapper.ArticleMapper;
import com.itstudy.mapper.PostLikeMapper;
import com.itstudy.mapper.QuestionMapper;
import com.itstudy.service.LikeService;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LikeServiceImpl implements LikeService {

    private final AppUserMapper users;
    private final ArticleMapper articles;
    private final QuestionMapper questions;
    private final PostLikeMapper likes;

    public LikeServiceImpl(AppUserMapper users, ArticleMapper articles, QuestionMapper questions, PostLikeMapper likes) {
        this.users = users;
        this.articles = articles;
        this.questions = questions;
        this.likes = likes;
    }

    @Override
    @Transactional
    public LikeResult toggle(Long userId, LikeForm form) {
        if (userId == null || users.selectById(userId) == null) {
            throw BizException.unauthorized();
        }
        String type = form.targetType();
        if (!"article".equals(type) && !"question".equals(type)) {
            throw BizException.validation("点赞类型无效");
        }
        Long id = form.targetId();
        boolean article = "article".equals(type);
        // 同一帖子上的写入串行，返回值与本次提交的计数一致。
        Integer count = article ? articles.lockLikeCount(id) : questions.lockLikeCount(id);
        if (count == null) {
            throw BizException.notFound("帖子不存在");
        }
        Boolean wanted = form.liked();
        if (!Boolean.TRUE.equals(wanted) && likes.deleteLike(userId, type, id) == 1) {
            adjustCount(article, id, -1);
            return new LikeResult(false, Math.max(0, count - 1));
        }
        if (Boolean.FALSE.equals(wanted)) {
            return new LikeResult(false, count);
        }
        PostLike like = new PostLike();
        like.setUserId(userId);
        like.setTargetType(type);
        like.setTargetId(id);
        try {
            likes.insert(like);
        } catch (DuplicateKeyException duplicate) {
            return new LikeResult(true, count);
        }
        adjustCount(article, id, 1);
        return new LikeResult(true, count + 1);
    }

    private void adjustCount(boolean article, Long id, int delta) {
        if (article) {
            articles.adjustLikes(id, delta);
        } else {
            questions.adjustLikes(id, delta);
        }
    }
}

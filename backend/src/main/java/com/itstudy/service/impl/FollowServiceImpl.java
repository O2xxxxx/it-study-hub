package com.itstudy.service.impl;

import com.itstudy.common.BizException;
import com.itstudy.common.PageResult;
import com.itstudy.dto.ArticleCard;
import com.itstudy.dto.FollowResult;
import com.itstudy.dto.QuestionCard;
import com.itstudy.dto.UserBrief;
import com.itstudy.dto.UserProfile;
import com.itstudy.dto.UserView;
import com.itstudy.entity.AppUser;
import com.itstudy.entity.UserFollow;
import com.itstudy.mapper.AppUserMapper;
import com.itstudy.mapper.ArticleMapper;
import com.itstudy.mapper.UserFollowMapper;
import com.itstudy.service.ArticleService;
import com.itstudy.service.AuthService;
import com.itstudy.service.FollowService;
import com.itstudy.service.QuestionService;
import com.itstudy.util.Pages;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class FollowServiceImpl implements FollowService {

    private final AppUserMapper users;
    private final UserFollowMapper follows;
    private final ArticleMapper articleMapper;
    private final ArticleService articles;
    private final QuestionService questions;
    private final AuthService auth;

    public FollowServiceImpl(AppUserMapper users, UserFollowMapper follows, ArticleMapper articleMapper,
                             ArticleService articles, QuestionService questions, AuthService auth) {
        this.users = users;
        this.follows = follows;
        this.articleMapper = articleMapper;
        this.articles = articles;
        this.questions = questions;
        this.auth = auth;
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfile profile(String username, Long viewer) {
        AppUser user = requireProfile(username);
        Long id = user.getId();
        boolean self = id.equals(viewer);
        return new UserProfile(id, user.getUsername(), user.getNickname(), user.getAvatarHue(), user.getPoints(),
                user.getCreatedAt(), articleMapper.countCards(null, id), users.countAnswers(id),
                user.getFollowerCount(), user.getFollowingCount(), viewer != null && !self && follows.existsFollow(viewer, id), self);
    }

    @Override
    public PageResult<ArticleCard> articles(String username, Integer page, Integer size, Long viewer) {
        return articles.page(null, page, size, "latest", requireProfile(username).getId(), viewer);
    }

    @Override
    public PageResult<QuestionCard> questions(String username, Integer page, Integer size, Long viewer) {
        return questions.pageByAuthor(null, null, page, size, viewer, requireProfile(username).getId());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult<UserBrief> connections(String username, boolean followers, Integer page, Integer size) {
        AppUser user = requireProfile(username);
        int p = Pages.page(page);
        int s = Pages.size(size, 12);
        int total = followers ? user.getFollowerCount() : user.getFollowingCount();
        long offset = (p - 1L) * s;
        if (offset >= total) {
            return new PageResult<>(List.of(), p, s, total);
        }
        List<Long> ids = followers ? follows.followers(user.getId(), (int) offset, s)
                : follows.following(user.getId(), (int) offset, s);
        Map<Long, AppUser> byId = ids.isEmpty() ? Map.of() : users.selectBatchIds(ids).stream()
                .collect(Collectors.toMap(AppUser::getId, Function.identity()));
        List<UserBrief> items = ids.stream().map(id -> {
            AppUser other = byId.get(id);
            return other == null ? new UserBrief(id, null, "已注销用户", null, true)
                    : new UserBrief(id, other.getUsername(), other.getNickname(), other.getAvatarHue(), false);
        }).toList();
        return new PageResult<>(items, p, s, total);
    }

    @Override
    @Transactional
    public FollowResult setFollowing(String username, Long viewer, boolean following) {
        if (viewer == null) {
            throw BizException.unauthorized();
        }
        Long target = requireProfile(username).getId();
        if (target.equals(viewer)) {
            throw BizException.validation("不能关注自己");
        }
        // 双向同时关注时按相同的 ID 顺序锁定用户。
        boolean viewerFirst = viewer < target;
        AppUser first = users.lockUser(viewerFirst ? viewer : target);
        AppUser second = users.lockUser(viewerFirst ? target : viewer);
        AppUser actor = viewerFirst ? first : second;
        AppUser profile = viewerFirst ? second : first;
        if (actor == null) {
            throw BizException.unauthorized();
        }
        if (profile == null) {
            throw BizException.notFound("用户不存在");
        }
        int delta = following ? insertFollow(viewer, target) : -follows.deleteFollow(viewer, target);
        if (delta != 0) {
            users.adjustFollowers(target, delta);
            users.adjustFollowing(viewer, delta);
        }
        return new FollowResult(following, Math.max(0, profile.getFollowerCount() + delta), profile.getFollowingCount());
    }

    private int insertFollow(Long from, Long to) {
        UserFollow row = new UserFollow();
        row.setFollowerId(from);
        row.setFolloweeId(to);
        try {
            return follows.insert(row);
        } catch (DuplicateKeyException duplicate) {
            return 0;
        }
    }

    @Override
    @Transactional
    public UserView rename(Long viewer, String nickname) {
        auth.requireUser(viewer);
        users.rename(viewer, nickname.trim());
        return auth.requireUser(viewer);
    }

    private AppUser requireProfile(String username) {
        AppUser user = users.selectByUsername(username);
        if (user == null) {
            throw BizException.notFound("用户不存在");
        }
        return user;
    }
}

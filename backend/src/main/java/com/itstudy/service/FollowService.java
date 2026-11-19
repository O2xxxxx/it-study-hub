package com.itstudy.service;

import com.itstudy.common.PageResult;
import com.itstudy.dto.ArticleCard;
import com.itstudy.dto.FollowResult;
import com.itstudy.dto.QuestionCard;
import com.itstudy.dto.UserBrief;
import com.itstudy.dto.UserProfile;
import com.itstudy.dto.UserView;

public interface FollowService {
    UserProfile profile(String username, Long viewer);
    PageResult<ArticleCard> articles(String username, Integer page, Integer size, Long viewer);
    PageResult<QuestionCard> questions(String username, Integer page, Integer size, Long viewer);
    PageResult<UserBrief> connections(String username, boolean followers, Integer page, Integer size);
    FollowResult setFollowing(String username, Long viewer, boolean following);
    UserView rename(Long viewer, String nickname);
}

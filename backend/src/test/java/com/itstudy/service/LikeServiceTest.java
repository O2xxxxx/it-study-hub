package com.itstudy.service;

import com.itstudy.dto.LikeForm;
import com.itstudy.dto.LikeResult;
import com.itstudy.entity.AppUser;
import com.itstudy.entity.PostLike;
import com.itstudy.mapper.AppUserMapper;
import com.itstudy.mapper.ArticleMapper;
import com.itstudy.mapper.PostLikeMapper;
import com.itstudy.mapper.QuestionMapper;
import com.itstudy.service.impl.LikeServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DuplicateKeyException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class LikeServiceTest {

    @Test
    void duplicateInsertReturnsCurrentCountWithoutUpdatingIt() {
        var users = mock(AppUserMapper.class);
        var articles = mock(ArticleMapper.class);
        var likes = mock(PostLikeMapper.class);
        var service = new LikeServiceImpl(users, articles, mock(QuestionMapper.class), likes);
        when(users.selectById(2L)).thenReturn(new AppUser());
        when(articles.lockLikeCount(10L)).thenReturn(3);
        when(likes.insert(any(PostLike.class))).thenThrow(new DuplicateKeyException("duplicate like"));

        assertEquals(new LikeResult(true, 3), service.toggle(2L, new LikeForm("article", 10L, true)));
        verify(articles, never()).adjustLikes(anyLong(), anyInt());
    }

    @Test
    void unlikeOfAbsentQuestionLikeNeverSubtracts() {
        var users = mock(AppUserMapper.class);
        var questions = mock(QuestionMapper.class);
        var likes = mock(PostLikeMapper.class);
        var service = new LikeServiceImpl(users, mock(ArticleMapper.class), questions, likes);
        when(users.selectById(2L)).thenReturn(new AppUser());
        when(questions.lockLikeCount(10L)).thenReturn(0);

        assertEquals(new LikeResult(false, 0), service.toggle(2L, new LikeForm("question", 10L, false)));
        verify(likes).deleteLike(2L, "question", 10L);
        verify(questions, never()).adjustLikes(anyLong(), anyInt());
    }
}

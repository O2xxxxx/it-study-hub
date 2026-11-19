package com.itstudy.service;

import com.itstudy.common.BizException;
import com.itstudy.dto.FollowResult;
import com.itstudy.entity.AppUser;
import com.itstudy.entity.UserFollow;
import com.itstudy.mapper.AppUserMapper;
import com.itstudy.mapper.ArticleMapper;
import com.itstudy.mapper.UserFollowMapper;
import com.itstudy.service.impl.FollowServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DuplicateKeyException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class FollowServiceTest {
    private final AppUserMapper users = mock(AppUserMapper.class);
    private final UserFollowMapper follows = mock(UserFollowMapper.class);
    private final FollowService service = new FollowServiceImpl(users, follows, mock(ArticleMapper.class),
            mock(ArticleService.class), mock(QuestionService.class), mock(AuthService.class));

    @Test
    void alreadyFollowingDoesNotChangeCounts() {
        AppUser target = user(5L);
        when(users.selectByUsername("target")).thenReturn(target);
        when(users.lockUser(3L)).thenReturn(user(3L));
        when(users.lockUser(5L)).thenReturn(target);
        when(follows.insert(any(UserFollow.class))).thenThrow(new DuplicateKeyException("duplicate follow"));

        assertEquals(new FollowResult(true, 2, 1), service.setFollowing("target", 3L, true));
        verify(users, never()).adjustFollowers(anyLong(), anyInt());
        verify(users, never()).adjustFollowing(anyLong(), anyInt());
    }

    @Test
    void rejectsFollowingSelfBeforeWriting() {
        when(users.selectByUsername("target")).thenReturn(user(5L));
        assertEquals("VALIDATION_ERROR", assertThrows(BizException.class,
                () -> service.setFollowing("target", 5L, true)).getCode());
        verifyNoInteractions(follows);
    }

    private AppUser user(Long id) {
        AppUser user = new AppUser();
        user.setId(id);
        user.setFollowerCount(2);
        user.setFollowingCount(1);
        return user;
    }
}

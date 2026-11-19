package com.itstudy.service;

import com.itstudy.dto.LikeForm;
import com.itstudy.dto.LikeResult;

public interface LikeService {
    LikeResult toggle(Long userId, LikeForm form);
}

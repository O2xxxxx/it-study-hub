package com.itstudy.service;

import com.itstudy.common.PageResult;
import com.itstudy.dto.PointLogView;
import com.itstudy.dto.PointSummary;

public interface PointService {

    PointSummary summary(Long userId);

    PageResult<PointLogView> logs(Long userId, Integer page, Integer size);
}

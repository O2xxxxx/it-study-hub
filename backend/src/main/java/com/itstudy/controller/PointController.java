package com.itstudy.controller;

import com.itstudy.common.CurrentUser;
import com.itstudy.common.PageResult;
import com.itstudy.common.RequireLogin;
import com.itstudy.dto.PointLogView;
import com.itstudy.dto.PointSummary;
import com.itstudy.service.PointService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/points")
@RequireLogin
public class PointController {

    private final PointService pointService;

    public PointController(PointService pointService) {
        this.pointService = pointService;
    }

    @GetMapping
    public PointSummary summary(@CurrentUser Long userId) {
        return pointService.summary(userId);
    }

    @GetMapping("/logs")
    public PageResult<PointLogView> logs(@RequestParam(required = false) Integer page,
                                         @RequestParam(required = false) Integer size,
                                         @CurrentUser Long userId) {
        return pointService.logs(userId, page, size);
    }
}

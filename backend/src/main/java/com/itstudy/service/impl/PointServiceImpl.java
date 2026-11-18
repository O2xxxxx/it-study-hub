package com.itstudy.service.impl;

import com.itstudy.common.PageResult;
import com.itstudy.dto.ExchangeView;
import com.itstudy.dto.PointLogView;
import com.itstudy.dto.PointSummary;
import com.itstudy.mapper.AppUserMapper;
import com.itstudy.mapper.PointLogMapper;
import com.itstudy.mapper.ResourceExchangeMapper;
import com.itstudy.service.PointService;
import com.itstudy.util.Pages;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PointServiceImpl implements PointService {

    private static final int OVERVIEW_LOG_SIZE = 10;

    private final AppUserMapper appUserMapper;
    private final PointLogMapper pointLogMapper;
    private final ResourceExchangeMapper exchangeMapper;

    public PointServiceImpl(AppUserMapper appUserMapper,
                            PointLogMapper pointLogMapper,
                            ResourceExchangeMapper exchangeMapper) {
        this.appUserMapper = appUserMapper;
        this.pointLogMapper = pointLogMapper;
        this.exchangeMapper = exchangeMapper;
    }

    @Override
    public PointSummary summary(Long userId) {
        PointSummary summary = new PointSummary();
        summary.setBalance(balance(userId));
        summary.setEarned(pointLogMapper.sumEarned(userId));
        summary.setSpent(pointLogMapper.sumSpent(userId));
        summary.setLogs(pointLogMapper.selectPage(userId, 0, OVERVIEW_LOG_SIZE));
        summary.setExchanges(exchangeMapper.selectExchanges(userId));
        return summary;
    }

    @Override
    public PageResult<PointLogView> logs(Long userId, Integer page, Integer size) {
        int p = Pages.page(page);
        int s = Pages.size(size, 20);
        long total = pointLogMapper.countByUser(userId);
        if (total <= 0) {
            return new PageResult<>(List.of(), p, s, 0);
        }
        List<PointLogView> items = pointLogMapper.selectPage(userId, Pages.offset(p, s), s);
        return new PageResult<>(items, p, s, total);
    }

    private int balance(Long userId) {
        Integer points = appUserMapper.selectBalance(userId);
        return points == null ? 0 : points;
    }
}

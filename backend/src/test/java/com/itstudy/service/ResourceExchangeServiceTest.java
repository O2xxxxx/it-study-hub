package com.itstudy.service;

import com.itstudy.common.BizException;
import com.itstudy.dto.ExchangeResult;
import com.itstudy.entity.PointLog;
import com.itstudy.entity.Resource;
import com.itstudy.entity.ResourceExchange;
import com.itstudy.mapper.AppUserMapper;
import com.itstudy.mapper.PointLogMapper;
import com.itstudy.mapper.ResourceExchangeMapper;
import com.itstudy.mapper.ResourceMapper;
import com.itstudy.service.impl.ResourceServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ResourceExchangeServiceTest {

    private ResourceMapper resourceMapper;
    private ResourceExchangeMapper exchangeMapper;
    private AppUserMapper appUserMapper;
    private PointLogMapper pointLogMapper;
    private ResourceServiceImpl resourceService;

    @BeforeEach
    void setUp() {
        resourceMapper = mock(ResourceMapper.class);
        exchangeMapper = mock(ResourceExchangeMapper.class);
        appUserMapper = mock(AppUserMapper.class);
        pointLogMapper = mock(PointLogMapper.class);
        resourceService = new ResourceServiceImpl(resourceMapper, exchangeMapper, appUserMapper,
                pointLogMapper, "../resources-data");
    }

    private Resource resource() {
        Resource resource = new Resource();
        resource.setId(1L);
        resource.setSectionId(1L);
        resource.setTitle("Spring MVC 请求流程图解");
        resource.setFileName("spring-mvc-request-flow.md");
        resource.setFileType("MD");
        resource.setFileSize(8420L);
        resource.setPoints(5);
        resource.setDownloadCount(0);
        resource.setCreatedAt(LocalDateTime.now());
        return resource;
    }

    private ResourceExchange existingExchange() {
        ResourceExchange exchange = new ResourceExchange();
        exchange.setId(7L);
        exchange.setUserId(1L);
        exchange.setResourceId(1L);
        exchange.setPointsCost(5);
        exchange.setCreatedAt(LocalDateTime.now());
        return exchange;
    }

    @Test
    @DisplayName("余额不足时抛 POINTS_NOT_ENOUGH 且不写积分流水")
    void insufficientPointsFails() {
        when(resourceMapper.selectById(1L)).thenReturn(resource());
        when(exchangeMapper.selectByUserAndResource(2L, 1L)).thenReturn(null);
        when(exchangeMapper.insert(any(ResourceExchange.class))).thenAnswer(invocation -> {
            ResourceExchange exchange = invocation.getArgument(0);
            exchange.setId(9L);
            return 1;
        });
        when(appUserMapper.deductPoints(2L, 5)).thenReturn(0);
        when(appUserMapper.selectBalance(2L)).thenReturn(2);

        BizException ex = assertThrows(BizException.class, () -> resourceService.exchange(1L, 2L));

        assertEquals("POINTS_NOT_ENOUGH", ex.getCode());
        assertEquals(400, ex.getStatus().value());
        Map<?, ?> details = (Map<?, ?>) ex.getDetails();
        assertEquals(2, details.get("balance"));
        assertEquals(5, details.get("required"));
        verify(pointLogMapper, never()).insert(any(PointLog.class));
    }

    @Test
    @DisplayName("重复兑换幂等返回 owned=true、pointsDelta=0")
    void duplicateExchangeIsIdempotent() {
        when(resourceMapper.selectById(1L)).thenReturn(resource());
        when(exchangeMapper.selectByUserAndResource(1L, 1L)).thenReturn(existingExchange());
        when(appUserMapper.selectBalance(1L)).thenReturn(19);

        ExchangeResult result = resourceService.exchange(1L, 1L);

        assertTrue(result.getOwned());
        assertEquals(0, result.getPointsDelta());
        assertEquals(19, result.getBalance());
        assertTrue(result.getAlreadyOwned());
        assertEquals(7L, result.getExchangeId());
        verify(exchangeMapper, never()).insert(any(ResourceExchange.class));
        verify(appUserMapper, never()).deductPoints(anyLong(), anyInt());
    }

    @Test
    @DisplayName("条件更新 rows=0 时抛错，避免余额被扣成负数")
    void conditionalDeductReturningZeroFails() {
        when(resourceMapper.selectById(1L)).thenReturn(resource());
        when(exchangeMapper.selectByUserAndResource(3L, 1L)).thenReturn(null);
        when(exchangeMapper.insert(any(ResourceExchange.class))).thenAnswer(invocation -> {
            ResourceExchange exchange = invocation.getArgument(0);
            exchange.setId(11L);
            return 1;
        });
        when(appUserMapper.deductPoints(3L, 5)).thenReturn(0);
        when(appUserMapper.selectBalance(3L)).thenReturn(3);

        BizException ex = assertThrows(BizException.class, () -> resourceService.exchange(1L, 3L));

        assertEquals("POINTS_NOT_ENOUGH", ex.getCode());
        assertTrue(ex.getMessage().contains("积分不足"));
        verify(appUserMapper, never()).addPoints(anyLong(), anyInt());
        verify(pointLogMapper, never()).insert(any(PointLog.class));
    }
}

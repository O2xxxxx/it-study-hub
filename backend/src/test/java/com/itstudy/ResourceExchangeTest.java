package com.itstudy;

import com.itstudy.common.BizException;
import com.itstudy.dto.ExchangeResult;
import com.itstudy.entity.AppUser;
import com.itstudy.entity.Resource;
import com.itstudy.entity.Section;
import com.itstudy.mapper.PointLogMapper;
import com.itstudy.mapper.ResourceExchangeMapper;
import com.itstudy.mapper.ResourceMapper;
import com.itstudy.service.ResourceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Transactional
class ResourceExchangeTest extends BaseIntegrationTest {

    @Autowired
    private ResourceService resourceService;
    @Autowired
    private ResourceMapper resourceMapper;
    @Autowired
    private ResourceExchangeMapper exchangeMapper;
    @Autowired
    private PointLogMapper pointLogMapper;

    @Test
    void exchangeDeductsPointsOnlyOnce() {
        AppUser uploader = createUser(0);
        AppUser buyer = createUser(12);
        Section section = createSection();
        Resource resource = createResource(uploader, section, 5);

        ExchangeResult first = resourceService.exchange(resource.getId(), buyer.getId());
        assertTrue(Boolean.TRUE.equals(first.getOwned()));
        assertFalse(Boolean.TRUE.equals(first.getAlreadyOwned()));
        assertEquals(-5, first.getPointsDelta().intValue());
        assertEquals(7, first.getBalance());
        assertNotNull(first.getExchangeId());
        assertEquals(7, appUserMapper.selectBalance(buyer.getId()).intValue());
        assertEquals(5, pointLogMapper.sumSpent(buyer.getId()));

        ExchangeResult again = resourceService.exchange(resource.getId(), buyer.getId());
        assertTrue(Boolean.TRUE.equals(again.getAlreadyOwned()));
        assertEquals(0, again.getPointsDelta().intValue());
        assertEquals(7, again.getBalance());
        assertEquals(first.getExchangeId(), again.getExchangeId());
        assertEquals(7, appUserMapper.selectBalance(buyer.getId()).intValue());
        assertEquals(1L, pointLogMapper.countByUser(buyer.getId()));
        assertNotNull(exchangeMapper.selectByUserAndResource(buyer.getId(), resource.getId()));
    }

    @Test
    void insufficientPointsRejectsExchange() {
        AppUser uploader = createUser(0);
        AppUser buyer = createUser(2);
        Section section = createSection();
        Resource resource = createResource(uploader, section, 5);

        BizException error = assertThrows(BizException.class,
                () -> resourceService.exchange(resource.getId(), buyer.getId()));

        assertEquals("POINTS_NOT_ENOUGH", error.getCode());
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
        assertEquals(2, error.getDetails().get("balance"));
        assertEquals(5, error.getDetails().get("required"));
        assertEquals(2, appUserMapper.selectBalance(buyer.getId()).intValue());
        assertEquals(0, pointLogMapper.countByUser(buyer.getId()));
    }

    private Resource createResource(AppUser uploader, Section section, int points) {
        Resource resource = new Resource();
        resource.setSectionId(section.getId());
        resource.setUploaderId(uploader.getId());
        resource.setTitle("事务与并发讲义");
        resource.setDescription("测试用资源");
        resource.setFileName("transactions.md");
        resource.setFileType("MD");
        resource.setFileSize(1024L);
        resource.setPoints(points);
        resource.setDownloadCount(0);
        resource.setCreatedAt(LocalDateTime.now());
        resourceMapper.insert(resource);
        return resource;
    }
}

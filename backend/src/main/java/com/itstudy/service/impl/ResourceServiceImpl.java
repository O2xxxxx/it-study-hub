package com.itstudy.service.impl;

import com.itstudy.common.BizException;
import com.itstudy.common.ErrorCodes;
import com.itstudy.common.PageResult;
import com.itstudy.dto.DownloadFile;
import com.itstudy.dto.ExchangeResult;
import com.itstudy.dto.ResourceCard;
import com.itstudy.entity.Resource;
import com.itstudy.entity.ResourceExchange;
import com.itstudy.mapper.AppUserMapper;
import com.itstudy.mapper.PointLogMapper;
import com.itstudy.mapper.ResourceExchangeMapper;
import com.itstudy.mapper.ResourceMapper;
import com.itstudy.service.ResourceService;
import com.itstudy.util.Pages;
import com.itstudy.util.PointAwarder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class ResourceServiceImpl implements ResourceService {

    private final ResourceMapper resourceMapper;
    private final ResourceExchangeMapper exchangeMapper;
    private final AppUserMapper appUserMapper;
    private final PointLogMapper pointLogMapper;
    private final String resourceDir;

    public ResourceServiceImpl(ResourceMapper resourceMapper,
                               ResourceExchangeMapper exchangeMapper,
                               AppUserMapper appUserMapper,
                               PointLogMapper pointLogMapper,
                               @Value("${app.storage.resource-dir:../resources-data}") String resourceDir) {
        this.resourceMapper = resourceMapper;
        this.exchangeMapper = exchangeMapper;
        this.appUserMapper = appUserMapper;
        this.pointLogMapper = pointLogMapper;
        this.resourceDir = resourceDir;
    }

    @Override
    public PageResult<ResourceCard> page(String sectionCode, Integer page, Integer size, Long userId) {
        int p = Pages.page(page);
        int s = Pages.size(size, 10);
        long total = resourceMapper.countCards(sectionCode);
        if (total <= 0) {
            return new PageResult<>(List.of(), p, s, 0);
        }
        List<ResourceCard> items = resourceMapper.selectCards(sectionCode, userId, Pages.offset(p, s), s);
        items.forEach(this::fillDownloadable);
        return new PageResult<>(items, p, s, total);
    }

    @Override
    public ResourceCard detail(Long id, Long userId) {
        ResourceCard card = resourceMapper.selectCardById(id, userId);
        if (card == null) {
            throw BizException.notFound("资源不存在");
        }
        fillDownloadable(card);
        return card;
    }

    @Override
    @Transactional
    public ExchangeResult exchange(Long id, Long userId) {
        Resource resource = resourceMapper.selectById(id);
        if (resource == null) {
            throw BizException.notFound("资源不存在");
        }
        ResourceExchange existed = exchangeMapper.selectByUserAndResource(userId, id);
        if (existed != null) {
            return alreadyOwned(existed.getId(), userId);
        }
        ResourceExchange exchange = new ResourceExchange();
        exchange.setUserId(userId);
        exchange.setResourceId(id);
        exchange.setPointsCost(resource.getPoints());
        exchange.setCreatedAt(LocalDateTime.now());
        try {
            exchangeMapper.insert(exchange);
        } catch (DuplicateKeyException ex) {
            ResourceExchange concurrent = exchangeMapper.selectByUserAndResource(userId, id);
            return alreadyOwned(concurrent == null ? null : concurrent.getId(), userId);
        }

        int cost = resource.getPoints() == null ? 0 : resource.getPoints();
        int rows = appUserMapper.deductPoints(userId, cost);
        if (rows == 0) {
            Integer balance = appUserMapper.selectBalance(userId);
            int current = balance == null ? 0 : balance;
            Map<String, Object> details = new LinkedHashMap<>();
            details.put("balance", current);
            details.put("required", cost);
            throw new BizException(ErrorCodes.POINTS_NOT_ENOUGH, HttpStatus.BAD_REQUEST,
                    "积分不足，当前 " + current + " 分，需要 " + cost + " 分", details);
        }
        Integer balanceAfter = appUserMapper.selectBalance(userId);
        int latest = balanceAfter == null ? 0 : balanceAfter;
        PointAwarder.recordSpend(pointLogMapper, userId, cost,
                "兑换资源《" + resource.getTitle() + "》",
                "resource_exchange",
                exchange.getId(),
                latest);

        ExchangeResult result = new ExchangeResult();
        result.setOwned(Boolean.TRUE);
        result.setPointsDelta(-cost);
        result.setBalance(latest);
        result.setExchangeId(exchange.getId());
        result.setAlreadyOwned(Boolean.FALSE);
        return result;
    }

    @Override
    public DownloadFile download(Long id, Long userId) {
        if (userId == null) {
            throw BizException.unauthorized();
        }
        Resource resource = resourceMapper.selectById(id);
        if (resource == null) {
            throw BizException.notFound("资源不存在");
        }
        if (exchangeMapper.selectByUserAndResource(userId, id) == null) {
            throw new BizException(ErrorCodes.NOT_EXCHANGED, HttpStatus.FORBIDDEN, "请先兑换该资源");
        }
        String fileName = resource.getFileName();
        if (fileName == null || fileName.isBlank()) {
            throw BizException.notFound("资源文件不存在");
        }
        Path baseDir = Paths.get(resourceDir).toAbsolutePath().normalize();
        Path file = baseDir.resolve(fileName).normalize();
        if (!file.startsWith(baseDir)) {
            throw BizException.forbidden("非法的文件路径");
        }
        if (!Files.isRegularFile(file)) {
            throw BizException.notFound("资源文件不存在");
        }
        resourceMapper.incrementDownload(id);

        DownloadFile downloadFile = new DownloadFile();
        downloadFile.setFileName(file.getFileName().toString());
        downloadFile.setPath(file);
        downloadFile.setContentType(contentType(resource.getFileType(), downloadFile.getFileName()));
        try {
            downloadFile.setFileSize(Files.size(file));
        } catch (IOException ex) {
            downloadFile.setFileSize(resource.getFileSize() == null ? 0L : resource.getFileSize());
        }
        return downloadFile;
    }

    private ExchangeResult alreadyOwned(Long exchangeId, Long userId) {
        Integer balance = appUserMapper.selectBalance(userId);
        ExchangeResult result = new ExchangeResult();
        result.setOwned(Boolean.TRUE);
        result.setPointsDelta(0);
        result.setBalance(balance == null ? 0 : balance);
        result.setExchangeId(exchangeId);
        result.setAlreadyOwned(Boolean.TRUE);
        return result;
    }

    private void fillDownloadable(ResourceCard card) {
        card.setCanDownload(Boolean.TRUE.equals(card.getOwned()));
    }

    private String contentType(String fileType, String fileName) {
        String type = fileType != null && !fileType.isBlank() ? fileType : extension(fileName);
        return switch (type == null ? "" : type.toLowerCase(Locale.ROOT)) {
            case "md", "markdown" -> "text/markdown; charset=UTF-8";
            case "txt" -> "text/plain; charset=UTF-8";
            case "pdf" -> "application/pdf";
            case "json" -> "application/json; charset=UTF-8";
            case "zip" -> "application/zip";
            default -> "application/octet-stream";
        };
    }

    private String extension(String fileName) {
        if (fileName == null) {
            return null;
        }
        int dot = fileName.lastIndexOf('.');
        return dot < 0 || dot == fileName.length() - 1 ? null : fileName.substring(dot + 1);
    }
}

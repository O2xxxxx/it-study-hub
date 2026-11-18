package com.itstudy.controller;

import com.itstudy.common.CurrentUser;
import com.itstudy.common.PageResult;
import com.itstudy.common.RequireLogin;
import com.itstudy.dto.DownloadFile;
import com.itstudy.dto.ExchangeResult;
import com.itstudy.dto.ResourceCard;
import com.itstudy.service.ResourceService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @GetMapping
    public PageResult<ResourceCard> page(@RequestParam(required = false) String sectionCode,
                                         @RequestParam(required = false) Integer page,
                                         @RequestParam(required = false) Integer size,
                                         @CurrentUser Long userId) {
        return resourceService.page(sectionCode, page, size, userId);
    }

    @GetMapping("/{id}")
    public ResourceCard detail(@PathVariable Long id, @CurrentUser Long userId) {
        return resourceService.detail(id, userId);
    }

    @PostMapping("/{id}/exchange")
    @RequireLogin
    public ExchangeResult exchange(@PathVariable Long id, @CurrentUser Long userId) {
        return resourceService.exchange(id, userId);
    }

    @GetMapping("/{id}/download")
    @RequireLogin
    public ResponseEntity<org.springframework.core.io.Resource> download(@PathVariable Long id,
                                                                        @CurrentUser Long userId) {
        DownloadFile file = resourceService.download(id, userId);
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(file.getFileName(), StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .contentType(MediaType.parseMediaType(file.getContentType()))
                .contentLength(file.getFileSize())
                .body(new FileSystemResource(file.getPath()));
    }
}

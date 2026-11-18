package com.itstudy.controller;

import com.itstudy.common.CurrentUser;
import com.itstudy.common.PageResult;
import com.itstudy.common.RequireLogin;
import com.itstudy.dto.ArticleCard;
import com.itstudy.dto.ArticleDetail;
import com.itstudy.dto.ArticleForm;
import com.itstudy.dto.PublishResult;
import com.itstudy.service.ArticleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    private final ArticleService articleService;

    public ArticleController(ArticleService articleService) {
        this.articleService = articleService;
    }

    @GetMapping
    public PageResult<ArticleCard> page(@RequestParam(required = false) String sectionCode,
                                        @RequestParam(required = false) Integer page,
                                        @RequestParam(required = false) Integer size,
                                        @RequestParam(required = false) String sort,
                                        @RequestParam(required = false) Long authorId,
                                        @CurrentUser Long userId) {
        return articleService.page(sectionCode, page, size, sort, authorId, userId);
    }

    @GetMapping("/{id}")
    public ArticleDetail detail(@PathVariable Long id, @CurrentUser Long userId) {
        return articleService.detail(id, userId);
    }

    @PostMapping
    @RequireLogin
    public ResponseEntity<PublishResult> publish(@Valid @RequestBody ArticleForm form,
                                                 @CurrentUser Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(articleService.publish(userId, form));
    }

    @PutMapping("/{id}")
    @RequireLogin
    public PublishResult update(@PathVariable Long id,
                                @Valid @RequestBody ArticleForm form,
                                @CurrentUser Long userId) {
        return articleService.update(id, userId, form);
    }

    @DeleteMapping("/{id}")
    @RequireLogin
    public ResponseEntity<Void> delete(@PathVariable Long id, @CurrentUser Long userId) {
        articleService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}

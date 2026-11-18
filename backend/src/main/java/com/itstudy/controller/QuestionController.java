package com.itstudy.controller;

import com.itstudy.common.CurrentUser;
import com.itstudy.common.PageResult;
import com.itstudy.common.RequireLogin;
import com.itstudy.dto.AcceptForm;
import com.itstudy.dto.AcceptResult;
import com.itstudy.dto.AnswerForm;
import com.itstudy.dto.AnswerResult;
import com.itstudy.dto.PublishResult;
import com.itstudy.dto.QuestionCard;
import com.itstudy.dto.QuestionDetail;
import com.itstudy.dto.QuestionForm;
import com.itstudy.service.QuestionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    private final QuestionService questionService;

    public QuestionController(QuestionService questionService) {
        this.questionService = questionService;
    }

    @GetMapping
    public PageResult<QuestionCard> page(@RequestParam(required = false) String sectionCode,
                                         @RequestParam(required = false) String filter,
                                         @RequestParam(required = false) Integer page,
                                         @RequestParam(required = false) Integer size,
                                         @CurrentUser Long userId) {
        return questionService.page(sectionCode, filter, page, size, userId);
    }

    @GetMapping("/{id}")
    public QuestionDetail detail(@PathVariable Long id, @CurrentUser Long userId) {
        return questionService.detail(id, userId);
    }

    @PostMapping
    @RequireLogin
    public PublishResult ask(@Valid @RequestBody QuestionForm form,
                             @CurrentUser Long userId) {
        return questionService.ask(userId, form);
    }

    @PostMapping("/{id}/answers")
    @RequireLogin
    public ResponseEntity<AnswerResult> answer(@PathVariable Long id,
                                               @Valid @RequestBody AnswerForm form,
                                               @CurrentUser Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(questionService.answer(userId, id, form));
    }

    @PostMapping("/{id}/accept")
    @RequireLogin
    public AcceptResult accept(@PathVariable Long id,
                               @Valid @RequestBody AcceptForm form,
                               @CurrentUser Long userId) {
        return questionService.accept(userId, id, form);
    }
}

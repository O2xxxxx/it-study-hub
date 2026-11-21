package com.itstudy.controller;

import com.fasterxml.jackson.databind.node.NullNode;
import com.itstudy.common.BizException;
import com.itstudy.common.CurrentUser;
import com.itstudy.common.RequireLogin;
import com.itstudy.dto.DraftForm;
import com.itstudy.dto.DraftView;
import com.itstudy.service.DraftService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/drafts")
@RequireLogin
public class DraftController {

    private final DraftService draftService;

    public DraftController(DraftService draftService) {
        this.draftService = draftService;
    }

    /**
     * draftKey 有值时返回单条草稿；省略 draftKey 时按 draftType 列出草稿（draftType 也可省略表示全部）。
     */
    @GetMapping
    public ResponseEntity<Object> get(@RequestParam(required = false) String draftType,
                                      @RequestParam(required = false) String draftKey,
                                      @CurrentUser Long userId) {
        if (draftKey == null || draftKey.isBlank()) {
            return ResponseEntity.ok(draftService.list(userId, draftType));
        }
        if (draftType == null || draftType.isBlank()) {
            throw BizException.validation("缺少 draftType");
        }
        DraftView draft = draftService.get(userId, draftType, draftKey);
        return ResponseEntity.ok(draft == null ? NullNode.getInstance() : (Object) draft);
    }

    @PutMapping
    public DraftView save(@Valid @RequestBody DraftForm form, @CurrentUser Long userId) {
        return draftService.save(userId, form);
    }

    @DeleteMapping
    public Map<String, Object> delete(@RequestParam String draftType,
                                      @RequestParam String draftKey,
                                      @CurrentUser Long userId) {
        draftService.delete(userId, draftType, draftKey);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("deleted", Boolean.TRUE);
        return body;
    }
}

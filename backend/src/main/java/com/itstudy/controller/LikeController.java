package com.itstudy.controller;

import com.itstudy.common.CurrentUser;
import com.itstudy.common.RequireLogin;
import com.itstudy.dto.LikeForm;
import com.itstudy.dto.LikeResult;
import com.itstudy.service.LikeService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/likes")
public class LikeController {

    private final LikeService likes;

    public LikeController(LikeService likes) {
        this.likes = likes;
    }

    @RequireLogin
    @PostMapping("/toggle")
    public LikeResult toggle(@CurrentUser Long viewer, @Valid @RequestBody LikeForm form) {
        return likes.toggle(viewer, form);
    }
}

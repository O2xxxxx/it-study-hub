package com.itstudy.controller;

import com.itstudy.common.CurrentUser;
import com.itstudy.common.RequireLogin;
import com.itstudy.dto.FavoriteGroups;
import com.itstudy.dto.FavoriteToggleForm;
import com.itstudy.dto.FavoriteToggleResult;
import com.itstudy.service.FavoriteService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/favorites")
@RequireLogin
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    public FavoriteGroups groups(@RequestParam(required = false) String type,
                                 @CurrentUser Long userId) {
        return favoriteService.groups(userId, type);
    }

    @PostMapping("/toggle")
    public FavoriteToggleResult toggle(@Valid @RequestBody FavoriteToggleForm form,
                                       @CurrentUser Long userId) {
        return favoriteService.toggle(userId, form);
    }
}

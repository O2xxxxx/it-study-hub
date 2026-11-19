package com.itstudy.controller;

import com.itstudy.common.CurrentUser;
import com.itstudy.common.PageResult;
import com.itstudy.common.RequireLogin;
import com.itstudy.dto.*;
import com.itstudy.service.FollowService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    private final FollowService profiles;

    public UserProfileController(FollowService profiles) {
        this.profiles = profiles;
    }

    @GetMapping("/{username}")
    public UserProfile profile(@PathVariable String username, @CurrentUser Long viewer) {
        return profiles.profile(username, viewer);
    }

    @GetMapping("/{username}/articles")
    public PageResult<ArticleCard> articles(@PathVariable String username, @RequestParam(required = false) Integer page,
                                          @RequestParam(required = false) Integer size, @CurrentUser Long viewer) {
        return profiles.articles(username, page, size, viewer);
    }

    @GetMapping("/{username}/questions")
    public PageResult<QuestionCard> questions(@PathVariable String username, @RequestParam(required = false) Integer page,
                                            @RequestParam(required = false) Integer size, @CurrentUser Long viewer) {
        return profiles.questions(username, page, size, viewer);
    }

    @GetMapping("/{username}/followers")
    public PageResult<UserBrief> followers(@PathVariable String username, @RequestParam(required = false) Integer page,
                                          @RequestParam(required = false) Integer size) {
        return profiles.connections(username, true, page, size);
    }

    @GetMapping("/{username}/following")
    public PageResult<UserBrief> following(@PathVariable String username, @RequestParam(required = false) Integer page,
                                          @RequestParam(required = false) Integer size) {
        return profiles.connections(username, false, page, size);
    }

    @RequireLogin
    @PostMapping("/{username}/follow")
    public FollowResult follow(@PathVariable String username, @CurrentUser Long viewer) {
        return profiles.setFollowing(username, viewer, true);
    }

    @RequireLogin
    @PostMapping("/{username}/unfollow")
    public FollowResult unfollow(@PathVariable String username, @CurrentUser Long viewer) {
        return profiles.setFollowing(username, viewer, false);
    }

    @RequireLogin
    @PatchMapping("/me")
    public UserView rename(@CurrentUser Long viewer, @Valid @RequestBody ProfileForm form) {
        return profiles.rename(viewer, form.nickname());
    }
}

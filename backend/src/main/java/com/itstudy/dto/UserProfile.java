package com.itstudy.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

public record UserProfile(Long id, String username, String nickname, Integer avatarHue, Integer points, LocalDateTime createdAt,
                          long articleCount, long answerCount, int followerCount, int followingCount,
                          boolean followedByMe, @JsonProperty("isSelf") boolean isSelf) {}

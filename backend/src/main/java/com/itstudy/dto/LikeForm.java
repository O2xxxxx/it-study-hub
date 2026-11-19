package com.itstudy.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

public record LikeForm(
        @NotNull @Pattern(regexp = "article|question") String targetType,
        @NotNull @Positive Long targetId,
        Boolean liked) {}

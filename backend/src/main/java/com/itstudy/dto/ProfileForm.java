package com.itstudy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProfileForm(@NotBlank @Size(max = 32) String nickname) {}

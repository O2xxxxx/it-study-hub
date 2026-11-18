package com.itstudy.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AcceptForm {

    @NotNull(message = "请选择要采纳的回答")
    private Long answerId;
}

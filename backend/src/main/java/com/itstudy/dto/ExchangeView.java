package com.itstudy.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ExchangeView {

    private Long id;
    private Long resourceId;
    private String resourceTitle;
    private String fileType;
    private Integer pointsCost;
    private LocalDateTime createdAt;
}

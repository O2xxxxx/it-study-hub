package com.itstudy.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PointLogView {

    private Long id;
    private Integer changeAmount;
    private Integer balanceAfter;
    private String reasonType;
    private String reasonDesc;
    private String refType;
    private Long refId;
    private LocalDateTime createdAt;
}

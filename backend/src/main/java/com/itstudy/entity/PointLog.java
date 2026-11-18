package com.itstudy.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;
@Data
@TableName("point_log")
public class PointLog {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Integer changeAmount;
    private Integer balanceAfter;
    private String reasonType;
    private String reasonDesc;
    private String refType;
    private Long refId;
    private LocalDateTime createdAt;
}

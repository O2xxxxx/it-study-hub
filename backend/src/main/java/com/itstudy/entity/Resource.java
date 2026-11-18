package com.itstudy.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;
@Data
@TableName("resource")
public class Resource {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long sectionId;
    private Long uploaderId;
    private String title;
    private String description;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private Integer points;
    private Integer downloadCount;
    private LocalDateTime createdAt;
}

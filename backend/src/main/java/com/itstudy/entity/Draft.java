package com.itstudy.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;
@Data
@TableName("draft")
public class Draft {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String draftType;
    private String draftKey;
    private String title;
    private Long sectionId;
    private String contentMd;
    private LocalDateTime updatedAt;
}

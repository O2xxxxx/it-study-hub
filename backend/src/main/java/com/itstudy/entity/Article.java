package com.itstudy.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;
@Data
@TableName("article")
public class Article {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Integer likeCount;
    private Long sectionId;
    private Long authorId;
    private String title;
    private String summary;
    private String contentMd;
    private Boolean rewardGranted;
    private Integer viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

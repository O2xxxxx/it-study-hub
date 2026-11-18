package com.itstudy.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ArticleCard {

    private Long id;
    private String title;
    private String summary;
    private Long sectionId;
    private String sectionCode;
    private String sectionName;
    private Long authorId;
    private String authorName;
    private Integer authorAvatarHue;
    private Boolean rewardGranted;
    private Integer viewCount;
    private LocalDateTime createdAt;
    private Boolean favorite;
}

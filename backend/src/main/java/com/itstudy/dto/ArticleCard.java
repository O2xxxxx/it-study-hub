package com.itstudy.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ArticleCard {

    private Long id;
    private int likeCount;
    private boolean likedByMe;
    private String title;
    private String summary;
    private Long sectionId;
    private String sectionCode;
    private String sectionName;
    private Long authorId;
    private String authorUsername;
    private String authorName;
    private Integer authorAvatarHue;
    private Boolean rewardGranted;
    private Integer viewCount;
    private LocalDateTime createdAt;
    private Boolean favorite;
}

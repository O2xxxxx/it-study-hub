package com.itstudy.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ArticleDetail {

    private Long id;
    private int likeCount;
    private boolean likedByMe;
    private String title;
    private String summary;
    private String contentMd;
    private String contentHtml;
    private SectionBrief section;
    private AuthorBrief author;
    private Boolean rewardGranted;
    private Integer viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean favorite;
    private Boolean canEdit;
}

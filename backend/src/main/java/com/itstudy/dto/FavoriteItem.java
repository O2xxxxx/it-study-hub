package com.itstudy.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class FavoriteItem {

    private Long id;
    private String type;
    private String title;
    private String summary;
    private String sectionCode;
    private String sectionName;
    private String authorName;
    private LocalDateTime createdAt;
    private Boolean favorited;
}

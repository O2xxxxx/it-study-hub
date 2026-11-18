package com.itstudy.dto;

import lombok.Data;

import java.time.LocalDateTime;

/** Raw row shared by the three search queries. */
@Data
public class SearchRow {

    private Long id;
    private String title;
    private String summary;
    private String description;
    private String contentMd;
    private String sectionCode;
    private String sectionName;
    private String authorName;
    private String fileType;
    private Integer points;
    private LocalDateTime createdAt;
}

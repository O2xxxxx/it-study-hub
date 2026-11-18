package com.itstudy.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ResourceDetail {

    private Long id;
    private String title;
    private String description;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private Integer points;
    private Integer downloadCount;
    private Long sectionId;
    private String sectionCode;
    private String sectionName;
    private SectionBrief section;
    private AuthorBrief uploader;
    private LocalDateTime createdAt;
    private Boolean owned;
    private Boolean canDownload;
}

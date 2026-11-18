package com.itstudy.dto;

import lombok.Data;

@Data
public class ResourceCard {

    private Long id;
    private String title;
    private String description;
    private String fileType;
    private Long fileSize;
    private Integer points;
    private Integer downloadCount;
    private Long sectionId;
    private String sectionCode;
    private String sectionName;
    private Boolean owned;
    private Boolean canDownload;
}

package com.itstudy.dto;

import lombok.Data;

@Data
public class SectionView {

    private Long id;
    private String code;
    private String name;
    private String tagline;
    private String description;
    private String icon;
    private String accent;
    private Integer sortOrder;
    private Integer articleCount;
    private Integer questionCount;
    private Integer resourceCount;
}

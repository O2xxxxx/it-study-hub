package com.itstudy.dto;

import lombok.Data;

@Data
public class SearchItem {

    private Long id;
    private String type;
    private String title;
    private String summary;
    private String sectionCode;
    private String sectionName;
    private String snippet;
    private String meta;
}

package com.itstudy.dto;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class SearchResult {

    private String keyword;
    private Integer total;
    private Long elapsedMs;
    private List<SearchGroup> groups = new ArrayList<>();
}

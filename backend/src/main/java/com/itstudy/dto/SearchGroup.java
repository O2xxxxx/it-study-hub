package com.itstudy.dto;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class SearchGroup {

    private String type;
    private String label;
    private List<SearchItem> items = new ArrayList<>();
}

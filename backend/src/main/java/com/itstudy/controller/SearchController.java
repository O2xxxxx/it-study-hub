package com.itstudy.controller;

import com.itstudy.dto.SearchResult;
import com.itstudy.service.SearchService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping
    public SearchResult search(@RequestParam("q") String q,
                               @RequestParam(required = false) String type,
                               @RequestParam(required = false) String sectionCode,
                               @RequestParam(required = false) Integer limit) {
        return searchService.search(q, type, sectionCode, limit);
    }
}

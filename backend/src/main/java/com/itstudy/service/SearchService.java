package com.itstudy.service;

import com.itstudy.dto.SearchResult;

public interface SearchService {

    SearchResult search(String keyword, String type, String sectionCode, Integer limit);
}

package com.itstudy.service.impl;

import com.itstudy.common.BizException;
import com.itstudy.dto.SearchGroup;
import com.itstudy.dto.SearchItem;
import com.itstudy.dto.SearchResult;
import com.itstudy.dto.SearchRow;
import com.itstudy.mapper.SearchMapper;
import com.itstudy.service.SearchService;
import com.itstudy.util.TextUtil;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class SearchServiceImpl implements SearchService {

    private static final int MAX_KEYWORD_LENGTH = 40;
    private static final int DEFAULT_LIMIT = 8;
    private static final int MAX_LIMIT = 20;
    private static final int SNIPPET_RADIUS = 60;

    private final SearchMapper searchMapper;

    public SearchServiceImpl(SearchMapper searchMapper) {
        this.searchMapper = searchMapper;
    }

    @Override
    public SearchResult search(String keyword, String type, String sectionCode, Integer limit) {
        String q = keyword == null ? "" : keyword.trim();
        if (q.isEmpty()) {
            throw BizException.validation("搜索关键字不能为空");
        }
        if (q.length() > MAX_KEYWORD_LENGTH) {
            throw BizException.validation("搜索关键字最多 " + MAX_KEYWORD_LENGTH + " 个字符");
        }
        String searchType = type == null || type.isBlank() ? "all" : type.trim().toLowerCase(Locale.ROOT);
        if (!List.of("all", "article", "question", "resource").contains(searchType)) {
            throw BizException.validation("type 只能是 all、article、question、resource");
        }
        int size = limit == null || limit <= 0 ? DEFAULT_LIMIT : Math.min(limit, MAX_LIMIT);
        String code = sectionCode == null || sectionCode.isBlank() ? null : sectionCode.trim();

        long start = System.currentTimeMillis();
        List<SearchGroup> groups = new ArrayList<>();
        int total = 0;
        if ("all".equals(searchType) || "article".equals(searchType)) {
            SearchGroup group = group("article", "文章",
                    searchMapper.searchArticles(q, code, size),
                    row -> TextUtil.snippet(TextUtil.stripMarkdown(row.getContentMd()), q, SNIPPET_RADIUS),
                    row -> row.getAuthorName() == null ? "匿名" : row.getAuthorName());
            groups.add(group);
            total += group.getItems().size();
        }
        if ("all".equals(searchType) || "question".equals(searchType)) {
            SearchGroup group = group("question", "问答",
                    searchMapper.searchQuestions(q, code, size),
                    row -> TextUtil.snippet(TextUtil.stripMarkdown(row.getContentMd()), q, SNIPPET_RADIUS),
                    row -> row.getAuthorName() == null ? "匿名" : row.getAuthorName());
            groups.add(group);
            total += group.getItems().size();
        }
        if ("all".equals(searchType) || "resource".equals(searchType)) {
            SearchGroup group = group("resource", "资源",
                    searchMapper.searchResources(q, code, size),
                    row -> TextUtil.snippet(row.getDescription(), q, SNIPPET_RADIUS),
                    row -> (row.getPoints() == null ? 0 : row.getPoints()) + " 积分"
                            + (row.getFileType() == null ? "" : " · " + row.getFileType()));
            groups.add(group);
            total += group.getItems().size();
        }

        SearchResult result = new SearchResult();
        result.setKeyword(q);
        result.setTotal(total);
        result.setElapsedMs(System.currentTimeMillis() - start);
        result.setGroups(groups);
        return result;
    }

    private SearchGroup group(String type,
                              String label,
                              List<SearchRow> rows,
                              java.util.function.Function<SearchRow, String> snippet,
                              java.util.function.Function<SearchRow, String> meta) {
        SearchGroup group = new SearchGroup();
        group.setType(type);
        group.setLabel(label);
        List<SearchItem> items = new ArrayList<>(rows.size());
        for (SearchRow row : rows) {
            SearchItem item = new SearchItem();
            item.setId(row.getId());
            item.setType(type);
            item.setTitle(row.getTitle());
            item.setSummary(summary(row));
            item.setSectionCode(row.getSectionCode());
            item.setSectionName(row.getSectionName());
            item.setSnippet(snippet.apply(row));
            item.setMeta(meta.apply(row));
            items.add(item);
        }
        group.setItems(items);
        return group;
    }

    private String summary(SearchRow row) {
        if (row.getSummary() != null && !row.getSummary().isBlank()) {
            return row.getSummary();
        }
        if (row.getDescription() != null && !row.getDescription().isBlank()) {
            return row.getDescription();
        }
        return TextUtil.summarize(row.getContentMd(), 120);
    }
}

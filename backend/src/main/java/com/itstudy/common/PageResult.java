package com.itstudy.common;

import java.util.List;

/** 契约统一分页结构 { items, page, size, total, totalPages }。 */
public class PageResult<T> {

    private final List<T> items;
    private final int page;
    private final int size;
    private final long total;
    private final int totalPages;

    public PageResult(List<T> items, int page, int size, long total) {
        this.items = items;
        this.page = page;
        this.size = size;
        this.total = total;
        this.totalPages = size <= 0 ? 0 : (int) ((total + size - 1) / size);
    }

    public List<T> getItems() {
        return items;
    }

    public int getPage() {
        return page;
    }

    public int getSize() {
        return size;
    }

    public long getTotal() {
        return total;
    }

    public int getTotalPages() {
        return totalPages;
    }
}

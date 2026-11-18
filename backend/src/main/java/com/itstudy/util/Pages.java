package com.itstudy.util;

/** 分页参数归一化。 */
public final class Pages {

    private static final int MAX_SIZE = 50;

    private Pages() {
    }

    public static int page(Integer page) {
        return page == null || page < 1 ? 1 : page;
    }

    public static int size(Integer size, int defaultSize) {
        if (size == null || size < 1) {
            return defaultSize;
        }
        return Math.min(size, MAX_SIZE);
    }

    public static int offset(int page, int size) {
        return (page - 1) * size;
    }
}

package com.pos.reporting.util;

import com.pos.reporting.dto.PageResponse;

import java.util.ArrayList;
import java.util.List;
import java.util.function.BiFunction;

public final class ReportingPageCollector {

    private static final int DEFAULT_PAGE_SIZE = 500;

    private ReportingPageCollector() {
    }

    public static <T> List<T> collectAll(BiFunction<Integer, Integer, PageResponse<T>> fetcher) {
        return collectAll(fetcher, DEFAULT_PAGE_SIZE);
    }

    public static <T> List<T> collectAll(BiFunction<Integer, Integer, PageResponse<T>> fetcher, int pageSize) {
        List<T> rows = new ArrayList<>();
        int page = 0;
        int totalPages = 1;
        int safeSize = Math.max(pageSize, 1);

        while (page < totalPages) {
            PageResponse<T> batch = fetcher.apply(page, safeSize);
            if (batch == null || batch.content() == null || batch.content().isEmpty()) {
                break;
            }
            rows.addAll(batch.content());
            totalPages = Math.max(batch.totalPages(), 1);
            page++;
        }

        return rows;
    }
}

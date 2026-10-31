package com.pos.shared.api;

import java.util.List;

/**
 * Platform page envelope for list APIs.
 * Field names match Spring Data {@code Page} JSON shape used across POS services.
 */
public record PageResponse<T>(
    List<T> content,
    int totalPages,
    long totalElements,
    int size,
    int number
) {
    public static <T> PageResponse<T> of(List<T> content, int page, int size, long totalElements) {
        int safeSize = Math.max(size, 1);
        int safePage = Math.max(page, 0);
        long total = Math.max(totalElements, 0);
        int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / (double) safeSize);
        List<T> rows = content == null ? List.of() : List.copyOf(content);
        return new PageResponse<>(rows, totalPages, total, safeSize, safePage);
    }

    public static <T> PageResponse<T> empty(int page, int size) {
        return of(List.of(), page, size, 0);
    }
}

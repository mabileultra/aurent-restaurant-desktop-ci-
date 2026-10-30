package com.pos.platform.dto.shared;

import org.springframework.data.domain.Page;

import java.util.List;

public record PageResponse<T>(
    List<T> content,
    int totalPages,
    long totalElements,
    int size,
    int number
) {
    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
            page.getContent(),
            page.getTotalPages(),
            page.getTotalElements(),
            page.getSize(),
            page.getNumber()
        );
    }

    /** In-memory page over an already-filtered list (collections rows, etc.). */
    public static <T> PageResponse<T> slice(List<T> all, org.springframework.data.domain.Pageable pageable) {
        if (all == null || all.isEmpty()) {
            int size = pageable.isPaged() ? pageable.getPageSize() : 0;
            return new PageResponse<>(List.of(), 0, 0, size, pageable.isPaged() ? pageable.getPageNumber() : 0);
        }
        if (!pageable.isPaged()) {
            return new PageResponse<>(all, 1, all.size(), all.size(), 0);
        }
        int size = Math.max(1, pageable.getPageSize());
        int page = Math.max(0, pageable.getPageNumber());
        long total = all.size();
        int totalPages = (int) Math.ceil((double) total / size);
        int from = Math.min(page * size, all.size());
        int to = Math.min(from + size, all.size());
        return new PageResponse<>(all.subList(from, to), Math.max(totalPages, 0), total, size, page);
    }
}

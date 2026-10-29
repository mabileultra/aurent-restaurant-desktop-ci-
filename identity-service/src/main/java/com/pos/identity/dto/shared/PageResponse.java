package com.pos.identity.dto.shared;

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

    public static <T> PageResponse<T> empty(int size, int number) {
        return new PageResponse<>(List.of(), 0, 0, size, number);
    }
}

package com.pos.ai.dto.shared;

import java.util.List;

public record PageResponse<T>(
    List<T> content,
    int pageNumber,
    long totalElements,
    int pageSize,
    int totalPages
) {
}

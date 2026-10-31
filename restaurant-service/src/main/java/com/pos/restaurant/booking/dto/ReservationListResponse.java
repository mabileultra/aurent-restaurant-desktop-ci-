package com.pos.restaurant.booking.dto;

import com.pos.shared.api.PageResponse;

import java.util.List;

/**
 * Platform page envelope ({@code content}/{@code number}) plus board {@code stats}.
 */
public record ReservationListResponse(
    List<ReservationResponse> content,
    int totalPages,
    long totalElements,
    int size,
    int number,
    ReservationStatusStats stats
) {
    public static ReservationListResponse of(
        PageResponse<ReservationResponse> page,
        ReservationStatusStats stats
    ) {
        return new ReservationListResponse(
            page.content(),
            page.totalPages(),
            page.totalElements(),
            page.size(),
            page.number(),
            stats == null ? ReservationStatusStats.empty() : stats
        );
    }
}

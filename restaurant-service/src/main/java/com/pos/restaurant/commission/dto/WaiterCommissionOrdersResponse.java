package com.pos.restaurant.commission.dto;

import java.util.List;

public record WaiterCommissionOrdersResponse(
    List<WaiterCommissionOrderRow> rows,
    int page,
    int size,
    long totalElements
) {
}

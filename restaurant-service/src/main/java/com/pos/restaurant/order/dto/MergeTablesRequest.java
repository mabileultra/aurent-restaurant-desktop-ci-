package com.pos.restaurant.order.dto;

import jakarta.validation.constraints.NotNull;

public record MergeTablesRequest(
    @NotNull Integer secondaryTableId
) {}

package com.pos.restaurant.order.dto;

import jakarta.validation.constraints.NotNull;

public record TransferTableRequest(
    @NotNull Integer targetTableId
) {}

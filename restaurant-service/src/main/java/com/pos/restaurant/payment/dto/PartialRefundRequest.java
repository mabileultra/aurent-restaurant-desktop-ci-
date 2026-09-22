package com.pos.restaurant.payment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record PartialRefundRequest(
    String reason,
    @NotEmpty @Valid List<PartialRefundLineRequest> lines
) {}

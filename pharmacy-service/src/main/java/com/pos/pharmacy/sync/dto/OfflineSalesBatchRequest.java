package com.pos.pharmacy.sync.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record OfflineSalesBatchRequest(
    @NotEmpty @Valid List<OfflineSaleSyncItem> sales
) {}

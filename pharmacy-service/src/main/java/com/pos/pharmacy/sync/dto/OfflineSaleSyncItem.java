package com.pos.pharmacy.sync.dto;

import com.pos.pharmacy.sales.dto.CreateSaleRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public record OfflineSaleSyncItem(
    @NotNull UUID clientSaleId,
    String offlineDeviceId,
    @NotNull Instant createdAt,
    UUID clientShiftId,
    Instant shiftOpenedAt,
    @NotNull @Valid CreateSaleRequest sale
) {}

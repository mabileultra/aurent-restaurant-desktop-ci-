package com.pos.sales.dto.sync;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.pos.sales.dto.sale.CreateSaleRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public record OfflineSaleSyncItem(
    @NotNull UUID clientSaleId,
    String offlineDeviceId,
    /** Client wall-clock when the receipt was taken (alias: clientCreatedAt). */
    @NotNull
    @JsonProperty("createdAt")
    @JsonAlias("clientCreatedAt")
    Instant createdAt,
    UUID clientShiftId,
    Instant shiftOpenedAt,
    @NotNull @Valid CreateSaleRequest sale
) {}

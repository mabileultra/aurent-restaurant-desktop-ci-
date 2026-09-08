package com.pos.platform.dto.billing;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record DeleteBillingLedgerRequest(
    @NotEmpty List<UUID> ids
) {}

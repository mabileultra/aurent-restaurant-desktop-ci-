package com.pos.platform.dto.billing;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record GrantDeferralRequest(
    @NotNull @Future LocalDate until,
    @Size(max = 255) String reason
) {}

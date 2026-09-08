package com.pos.platform.dto.billing;

import jakarta.validation.constraints.Size;

public record ReviewTopUpRequest(
    @Size(max = 500) String reviewNote
) {}

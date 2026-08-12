package com.pos.scales.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AssignPluRequest(
    @NotNull UUID productId,
    String plu
) {}

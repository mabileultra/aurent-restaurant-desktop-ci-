package com.pos.restaurant.edge.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record EdgePinLoginRequest(
    @NotBlank String companyLoginCode,
    @NotBlank String pin,
    UUID userId
) {}

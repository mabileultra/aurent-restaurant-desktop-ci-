package com.pos.identity.dto.auth;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record CashierPinAuthRequest(
    @NotBlank String companyLoginCode,
    @NotBlank String pin,
    /** When set (restaurant roster), PIN must match this user. */
    UUID userId
) {}

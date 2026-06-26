package com.pos.identity.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record VerifyPasswordRequest(@NotBlank String password) {}

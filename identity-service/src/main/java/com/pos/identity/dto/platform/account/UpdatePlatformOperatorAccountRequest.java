package com.pos.identity.dto.platform.account;

import jakarta.validation.constraints.Size;

public record UpdatePlatformOperatorAccountRequest(
    String username,
    @Size(min = 6, message = "Password must be at least 6 characters") String password
) {}

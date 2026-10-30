package com.pos.identity.dto.platform.security;

import com.pos.identity.util.EmailAddressRules;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreatePlatformSuperAdminRequest(
    @NotBlank String firstName,
    @NotBlank String lastName,
    @NotBlank String username,
    @NotBlank
    @Size(max = 254)
    @Pattern(regexp = EmailAddressRules.PATTERN, message = EmailAddressRules.MESSAGE)
    String email,
    @NotBlank @Size(min = 6, message = "Password must be at least 6 characters") String password,
    String role
) {}

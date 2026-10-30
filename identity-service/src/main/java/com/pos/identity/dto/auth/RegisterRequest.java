package com.pos.identity.dto.auth;

import com.pos.identity.util.EmailAddressRules;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank String username,
    @NotBlank
    @Size(max = 254)
    @Pattern(regexp = EmailAddressRules.PATTERN, message = EmailAddressRules.MESSAGE)
    String email,
    @NotBlank @Size(min = 6) String password,
    @NotBlank String fullName
) {}

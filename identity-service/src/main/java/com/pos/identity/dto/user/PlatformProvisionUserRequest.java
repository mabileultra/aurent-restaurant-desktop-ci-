package com.pos.identity.dto.user;

import com.pos.identity.util.EmailAddressRules;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PlatformProvisionUserRequest(
    @NotNull Integer companyId,
    @NotBlank String username,
    @NotBlank
    @Size(max = 254)
    @Pattern(regexp = EmailAddressRules.PATTERN, message = EmailAddressRules.MESSAGE)
    String email,
    String password,
    String firstName,
    String lastName,
    List<Integer> storeIds
) {}

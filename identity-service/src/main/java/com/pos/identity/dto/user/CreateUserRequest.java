package com.pos.identity.dto.user;

import com.pos.identity.util.EmailAddressRules;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateUserRequest(
    String firstName,
    String lastName,
    String patronymic,
    String fullName,
    @NotBlank String username,
    @NotBlank
    @Size(max = 254)
    @Pattern(regexp = EmailAddressRules.PATTERN, message = EmailAddressRules.MESSAGE)
    String email,
    String password,
    String pin,
    @NotBlank String role,
    Integer companyId,
    List<Integer> storeIds
) {}

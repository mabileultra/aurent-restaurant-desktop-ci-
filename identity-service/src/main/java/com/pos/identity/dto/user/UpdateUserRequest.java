package com.pos.identity.dto.user;

import com.pos.identity.util.EmailAddressRules;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateUserRequest(
    @Size(min = 1, max = 100, message = "Username is required") String username,
    String pin,
    String firstName,
    String lastName,
    String patronymic,
    String fullName,
    @Size(max = 254)
    @Pattern(regexp = EmailAddressRules.PATTERN, message = EmailAddressRules.MESSAGE)
    String email,
    String password,
    String role,
    Integer companyId,
    List<Integer> storeIds
) {}

package com.pos.identity.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record CreateUserRequest(
    String firstName,
    String lastName,
    String patronymic,
    String fullName,
    @NotBlank String username,
    @NotBlank @Email String email,
    String password,
    String pin,
    @NotBlank String role,
    Integer companyId,
    List<Integer> storeIds
) {}

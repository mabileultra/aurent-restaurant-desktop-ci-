package com.pos.identity.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateUserRequest(
    @Size(min = 1, max = 100, message = "Username is required") String username,
    String pin,
    String firstName,
    String lastName,
    String patronymic,
    String fullName,
    @Email String email,
    String password,
    String role,
    Integer companyId,
    List<Integer> storeIds
) {}

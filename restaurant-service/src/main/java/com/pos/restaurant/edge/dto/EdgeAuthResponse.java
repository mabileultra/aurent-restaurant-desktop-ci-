package com.pos.restaurant.edge.dto;

import java.util.List;

/** Same shape as identity AuthResponse so restaurant-frontend works unchanged. */
public record EdgeAuthResponse(
    String token,
    String id,
    String username,
    String email,
    String firstName,
    String lastName,
    String patronymic,
    String fullName,
    String role,
    Integer companyId,
    String companyLoginCode,
    List<Integer> storeIds,
    List<String> allowedModules,
    boolean moduleAccessCustom
) {}

package com.pos.identity.dto.user;

import java.util.List;
import java.util.UUID;

public record ManagedUserResponse(
    UUID id,
    String username,
    String email,
    String firstName,
    String lastName,
    String patronymic,
    String fullName,
    String role,
    Integer companyId,
    String companyName,
    String companyLoginCode,
    String regionCode,
    String districtCode,
    String businessType,
    List<Integer> storeIds,
    List<String> storeNames,
    boolean active,
    boolean hasPin
) {}

package com.pos.restaurant.edge.dto;

import java.util.List;
import java.util.UUID;

public record EdgeStaffBootstrapItem(
    UUID userId,
    String username,
    String email,
    String fullName,
    String role,
    /** BCrypt hash from cloud, or leave empty and pass password. */
    String passwordHash,
    String password,
    String pinHash,
    String pin,
    List<Integer> storeIds,
    List<String> allowedModules,
    Boolean canRequestBill,
    Boolean active,
    String companyLoginCode
) {}

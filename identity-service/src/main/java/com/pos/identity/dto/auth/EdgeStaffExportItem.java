package com.pos.identity.dto.auth;

import java.util.List;
import java.util.UUID;

/** Staff row for restaurant-desktop offline bootstrap (hashes only, never plaintext). */
public record EdgeStaffExportItem(
    UUID userId,
    String username,
    String email,
    String fullName,
    String role,
    String passwordHash,
    String pinHash,
    List<Integer> storeIds,
    List<String> allowedModules,
    Boolean canRequestBill,
    Boolean active,
    String companyLoginCode
) {}

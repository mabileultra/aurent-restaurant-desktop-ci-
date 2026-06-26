package com.pos.identity.dto.access;

import java.util.UUID;

public record UserModuleAccessSummary(
    UUID userId,
    String username,
    String fullName,
    String role,
    Integer companyId,
    String companyName,
    boolean moduleAccessCustom
) {}

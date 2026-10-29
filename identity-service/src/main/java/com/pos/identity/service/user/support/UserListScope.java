package com.pos.identity.service.user.support;

import java.util.List;
import java.util.UUID;

public record UserListScope(
    List<Integer> companyIds,
    List<Integer> searchCompanyIds,
    List<UUID> searchUserIds,
    List<String> allowedRoles,
    boolean includeSuperAdmin
) {}

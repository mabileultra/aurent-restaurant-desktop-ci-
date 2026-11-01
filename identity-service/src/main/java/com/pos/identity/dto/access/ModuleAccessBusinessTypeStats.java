package com.pos.identity.dto.access;

import java.util.List;

public record ModuleAccessBusinessTypeStats(
    String code,
    long totalEmployees,
    long exceptionCount,
    List<ModuleAccessRoleStats> roles
) {
}

package com.pos.identity.dto.access;

public record ModuleAccessRoleStats(
    String role,
    long totalEmployees,
    long exceptionCount
) {
}

package com.pos.identity.security;

import com.pos.identity.exception.BadRequestException;

public final class PlatformStaffRole {

    private PlatformStaffRole() {
    }

    public static String resolveCreateRole(String requested) {
        String value = requested == null ? "" : requested.trim();
        if (value.isEmpty() || RoleName.PLATFORM_ADMIN.matches(value)) {
            return RoleName.PLATFORM_ADMIN.key();
        }
        if (RoleName.PLATFORM_ANALYTICS.matches(value)) {
            return RoleName.PLATFORM_ANALYTICS.key();
        }
        if (RoleName.SUPER_ADMIN.matches(value)) {
            return RoleName.SUPER_ADMIN.key();
        }
        throw new BadRequestException("Invalid platform role");
    }
}

package com.pos.identity.util;

import java.util.Set;

/**
 * Roles that may authenticate via terminal PIN.
 * ADMIN stays password-only (Chrome). Pharmacy managers may omit PIN.
 */
public final class PinLoginRoles {

    public static final Set<String> ALL = Set.of("MANAGER", "CASHIER", "WAITER", "COOK");

    /** PIN required on create/role-assign (floor staff). MANAGER PIN is optional at API for pharmacy. */
    public static final Set<String> REQUIRED_ON_ASSIGN = Set.of("CASHIER", "WAITER", "COOK");

    private PinLoginRoles() {
    }

    public static boolean usesPin(String roleName) {
        return roleName != null && ALL.contains(roleName.trim().toUpperCase());
    }

    public static boolean requiresPinOnAssign(String roleName) {
        return roleName != null && REQUIRED_ON_ASSIGN.contains(roleName.trim().toUpperCase());
    }
}

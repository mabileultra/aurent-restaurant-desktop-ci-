package com.pos.restaurant.modifier.support;

import com.pos.restaurant.modifier.domain.ModifierGroupKind;

/** SIZE groups always require exactly one option (one plate size). */
public final class ModifierGroupKindSupport {

    private ModifierGroupKindSupport() {}

    public static ModifierGroupKind normalize(ModifierGroupKind kind) {
        return kind == null ? ModifierGroupKind.STANDARD : kind;
    }

    public static int minSelect(ModifierGroupKind kind, Integer requested) {
        if (normalize(kind) == ModifierGroupKind.SIZE) {
            return 1;
        }
        return requested == null ? 0 : requested;
    }

    public static int maxSelect(ModifierGroupKind kind, Integer requested) {
        if (normalize(kind) == ModifierGroupKind.SIZE) {
            return 1;
        }
        return requested == null ? 1 : requested;
    }
}

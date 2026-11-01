package com.pos.identity.dto.access;

import java.util.Map;

public record RoleTemplateResponse(
    String businessType,
    String role,
    Map<String, Boolean> modules,
    /** TEMPLATE when saved override exists, otherwise DEFAULT from AdminModule enum. */
    String source,
    int affectedCount
) {
}

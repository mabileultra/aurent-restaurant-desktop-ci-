package com.pos.shared.gateway;

import com.pos.shared.http.TenantHeaders;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Какие заголовки можно переслать в другой сервис.
 * Если gateway уже подписал вызов, JWT дальше не тащим.
 */
public final class OutboundCallerHeaders {

    public static final String AUTHORIZATION = "Authorization";

    private OutboundCallerHeaders() {
    }

    public static Map<String, String> select(
        String userId,
        String companyId,
        String role,
        String stamp,
        String authorization,
        String contextSecret
    ) {
        if (GatewayContextStamp.verify(userId, companyId, role, stamp, contextSecret).isPresent()) {
            Map<String, String> headers = new LinkedHashMap<>();
            headers.put(TenantHeaders.USER_ID, userId.trim());
            headers.put(TenantHeaders.USER_ROLES, role.trim());
            headers.put(TenantHeaders.GATEWAY_STAMP, stamp.trim());
            if (companyId != null && !companyId.isBlank()) {
                headers.put(TenantHeaders.COMPANY_ID, companyId.trim());
            }
            return headers;
        }
        if (authorization != null && !authorization.isBlank()) {
            return Map.of(AUTHORIZATION, authorization);
        }
        return Map.of();
    }
}

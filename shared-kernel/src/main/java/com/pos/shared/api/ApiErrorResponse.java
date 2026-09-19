package com.pos.shared.api;

import java.time.Instant;
import java.util.Map;

/**
 * Единый формат ошибки REST API.
 */
public record ApiErrorResponse(
    int status,
    String code,
    String message,
    String path,
    Instant timestamp,
    Map<String, Object> context
) {
    public static ApiErrorResponse of(
        int status,
        ErrorCode code,
        String message,
        String path,
        Map<String, Object> context
    ) {
        return of(status, code.name(), message, path, context);
    }

    public static ApiErrorResponse of(
        int status,
        String code,
        String message,
        String path,
        Map<String, Object> context
    ) {
        Map<String, Object> ctx = context == null || context.isEmpty() ? null : Map.copyOf(context);
        return new ApiErrorResponse(
            status,
            code,
            message,
            path,
            Instant.now(),
            ctx
        );
    }
}

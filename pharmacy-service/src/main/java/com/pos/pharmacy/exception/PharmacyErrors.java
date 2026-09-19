package com.pos.pharmacy.exception;

import java.util.LinkedHashMap;
import java.util.Map;

public final class PharmacyErrors {

    private PharmacyErrors() {}

    public static BusinessException of(PharmacyErrorCode code) {
        return new BusinessException(code);
    }

    public static BusinessException of(PharmacyErrorCode code, String message) {
        return new BusinessException(code, message);
    }

    public static BusinessException of(PharmacyErrorCode code, String contextKey, Object contextValue) {
        return new BusinessException(code, Map.of(contextKey, String.valueOf(contextValue)));
    }

    public static BusinessException of(
        PharmacyErrorCode code,
        String message,
        String contextKey,
        Object contextValue
    ) {
        return new BusinessException(code, message, Map.of(contextKey, String.valueOf(contextValue)));
    }

    public static NotFoundException notFound(PharmacyErrorCode code) {
        return new NotFoundException(code);
    }

    public static NotFoundException notFound(PharmacyErrorCode code, Object id) {
        Map<String, Object> ctx = new LinkedHashMap<>();
        if (id != null) {
            ctx.put("id", String.valueOf(id));
        }
        String message = id == null ? code.message() : code.message() + ": " + id;
        return new NotFoundException(code, message, ctx);
    }
}

package com.pos.pharmacy.exception;

import java.util.LinkedHashMap;
import java.util.Map;

public final class PharmacyErrors {

    private PharmacyErrors() {}

    public static BusinessException badRequest(String message) {
        return new BusinessException(message);
    }

    public static BusinessException badRequest(String message, String contextKey, Object contextValue) {
        return new BusinessException(message, Map.of(contextKey, String.valueOf(contextValue)));
    }

    public static NotFoundException notFound(String entity, Object id) {
        String label = entity != null ? entity : "Resource";
        String msg = id != null ? label + " not found: " + id : label + " not found";
        Map<String, Object> ctx = new LinkedHashMap<>();
        if (entity != null) {
            ctx.put("entity", entity);
        }
        if (id != null) {
            ctx.put("id", String.valueOf(id));
        }
        return new NotFoundException(msg, ctx);
    }

    public static NotFoundException notFound(String message) {
        return new NotFoundException(message);
    }

    public static BusinessException conflict(String message, String contextKey, Object contextValue) {
        return new BusinessException(message, Map.of(contextKey, String.valueOf(contextValue)));
    }
}

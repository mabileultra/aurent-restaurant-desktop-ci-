package com.pos.pharmacy.security;

public final class RequestAuthContext {

    private static final ThreadLocal<String> BEARER = new ThreadLocal<>();

    private RequestAuthContext() {}

    public static void setBearerToken(String token) {
        BEARER.set(token);
    }

    public static String bearerToken() {
        return BEARER.get();
    }

    public static void clear() {
        BEARER.remove();
    }
}

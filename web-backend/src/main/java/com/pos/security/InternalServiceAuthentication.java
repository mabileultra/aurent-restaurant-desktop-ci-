package com.pos.security;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

/**
 * Служебный вход для вызова сервиса по внутреннему ключу, без пользовательского JWT.
 */
public final class InternalServiceAuthentication {

    private InternalServiceAuthentication() {
    }

    public static void authenticate() {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(
                "internal-service",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_INTERNAL"))
            )
        );
    }
}

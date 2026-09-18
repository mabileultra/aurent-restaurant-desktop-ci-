package com.pos.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class InternalServiceAuthenticationTest {

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticateSetsInternalRole() {
        InternalServiceAuthentication.authenticate();

        var authentication = SecurityContextHolder.getContext().getAuthentication();
        assertEquals("internal-service", authentication.getName());
        assertTrue(authentication.getAuthorities().stream()
            .anyMatch(authority -> "ROLE_INTERNAL".equals(authority.getAuthority())));
    }
}

package com.pos.security;

import com.pos.repository.UserRepository;
import com.pos.security.cache.AuthenticatedUserCache;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(MockitoExtension.class)
class CurrentUserProviderInternalTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private AuthenticatedUserCache authenticatedUserCache;

    @InjectMocks
    private CurrentUserProvider currentUserProvider;

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void internalServiceHasNoUserPrincipal() {
        assertFalse(currentUserProvider.isInternalService());
        InternalServiceAuthentication.authenticate();
        assertTrue(currentUserProvider.isInternalService());
    }
}

package com.pos.identity.service.account.impl;

import com.pos.identity.dto.platform.account.UpdatePlatformOperatorAccountRequest;
import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.exception.ConflictException;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.service.support.TenantAccessSupport;
import com.pos.identity.service.support.UserSyncSupport;
import com.pos.identity.support.IdentityUsers;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlatformOperatorAccountServiceImplTest {

    @Mock
    private TenantAccessSupport tenantAccess;
    @Mock
    private UserRepository userRepository;
    @Mock
    private UserSyncSupport userSyncSupport;

    @InjectMocks
    private PlatformOperatorAccountServiceImpl service;

    @Test
    void rejectsNonOperator() {
        when(tenantAccess.currentUser()).thenReturn(IdentityUsers.user("SUPER_ADMIN", null));
        assertThrows(BadRequestException.class, () -> service.current());
        assertThrows(
            BadRequestException.class,
            () -> service.update(new UpdatePlatformOperatorAccountRequest("x", null))
        );
    }

    @Test
    void updatesOwnUsernameOnly() {
        User operator = IdentityUsers.user("PLATFORM_ADMIN", null);
        operator.setUsername("platformadmin");
        when(tenantAccess.currentUser()).thenReturn(operator);
        when(userRepository.count(any(Specification.class))).thenReturn(0L);
        when(userRepository.save(operator)).thenReturn(operator);

        var response = service.update(new UpdatePlatformOperatorAccountRequest("my-login", null));
        assertEquals("my-login", response.username());
        verify(userSyncSupport).syncUpdate(operator);
    }

    @Test
    void rejectsSelfPasswordChange() {
        User operator = IdentityUsers.user("PLATFORM_ADMIN", null);
        operator.setUsername("platformadmin");
        when(tenantAccess.currentUser()).thenReturn(operator);
        assertThrows(
            BadRequestException.class,
            () -> service.update(new UpdatePlatformOperatorAccountRequest("platformadmin", "secret1"))
        );
        verify(userRepository, never()).save(any());
    }

    @Test
    void rejectsTakenUsername() {
        User operator = IdentityUsers.user("PLATFORM_ADMIN", null);
        operator.setUsername("platformadmin");
        when(tenantAccess.currentUser()).thenReturn(operator);
        when(userRepository.count(any(Specification.class))).thenReturn(1L);
        assertThrows(
            ConflictException.class,
            () -> service.update(new UpdatePlatformOperatorAccountRequest("taken", null))
        );
        verify(userRepository, never()).save(any());
    }
}

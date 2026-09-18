package com.pos.identity.service.impl;

import com.pos.identity.exception.BadRequestException;
import com.pos.identity.mapper.UserMapper;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.service.support.TenantAccessSupport;
import com.pos.identity.service.support.UserSyncSupport;
import com.pos.identity.service.user.impl.UserCreateHandler;
import com.pos.identity.service.user.impl.UserDeleteHandler;
import com.pos.identity.service.user.impl.UserUpdateHandler;
import com.pos.identity.service.user.support.UserAccessPolicy;
import com.pos.identity.support.IdentityUsers;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private TenantAccessSupport tenantAccess;
    @Mock
    private UserAccessPolicy accessPolicy;
    @Mock
    private UserMapper userMapper;
    @Mock
    private UserCreateHandler createHandler;
    @Mock
    private UserUpdateHandler updateHandler;
    @Mock
    private UserDeleteHandler deleteHandler;
    @Mock
    private UserSyncSupport userSyncSupport;

    @InjectMocks
    private UserServiceImpl service;

    @Test
    void cannotDeactivatePlatformAdmin() {
        UUID id = UUID.randomUUID();
        when(accessPolicy.requireAccessible(id)).thenReturn(IdentityUsers.user("PLATFORM_ADMIN", null));
        assertThrows(BadRequestException.class, () -> service.toggleActive(id));
        verify(userRepository, never()).saveAndFlush(any());
    }

    @Test
    void cannotDeactivateSuperAdmin() {
        UUID id = UUID.randomUUID();
        when(accessPolicy.requireAccessible(id)).thenReturn(IdentityUsers.user("SUPER_ADMIN", null));
        assertThrows(BadRequestException.class, () -> service.toggleActive(id));
        verify(userRepository, never()).saveAndFlush(any());
    }
}

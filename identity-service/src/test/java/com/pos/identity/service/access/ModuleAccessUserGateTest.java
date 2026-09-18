package com.pos.identity.service.access;

import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.exception.ResourceNotFoundException;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.support.IdentityUsers;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ModuleAccessUserGateTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ModuleAccessUserGate gate;

    @Test
    void allowsTenantUserAndPlatformOperator() {
        UUID tenantId = UUID.randomUUID();
        UUID operatorId = UUID.randomUUID();
        User tenant = IdentityUsers.user(tenantId, "ADMIN", 8);
        User operator = IdentityUsers.user(operatorId, "PLATFORM_ADMIN", null);
        when(userRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(userRepository.findById(operatorId)).thenReturn(Optional.of(operator));

        assertSame(tenant, gate.requireConfigurable(tenantId));
        assertSame(operator, gate.requireConfigurable(operatorId));
    }

    @Test
    void rejectsMissingSuperAdminAndBrokenOperator() {
        UUID missing = UUID.randomUUID();
        UUID superAdminId = UUID.randomUUID();
        UUID brokenOperatorId = UUID.randomUUID();
        UUID orphanId = UUID.randomUUID();
        when(userRepository.findById(missing)).thenReturn(Optional.empty());
        when(userRepository.findById(superAdminId)).thenReturn(Optional.of(IdentityUsers.user(superAdminId, "SUPER_ADMIN", null)));
        when(userRepository.findById(brokenOperatorId)).thenReturn(Optional.of(IdentityUsers.user(brokenOperatorId, "PLATFORM_ADMIN", 3)));
        when(userRepository.findById(orphanId)).thenReturn(Optional.of(IdentityUsers.user(orphanId, "ADMIN", null)));

        assertThrows(ResourceNotFoundException.class, () -> gate.requireConfigurable(missing));
        assertThrows(BadRequestException.class, () -> gate.requireConfigurable(superAdminId));
        assertThrows(BadRequestException.class, () -> gate.requireConfigurable(brokenOperatorId));
        assertThrows(BadRequestException.class, () -> gate.requireConfigurable(orphanId));
    }
}

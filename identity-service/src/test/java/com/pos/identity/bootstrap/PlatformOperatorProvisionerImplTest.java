package com.pos.identity.bootstrap;

import com.pos.identity.entity.Role;
import com.pos.identity.entity.User;
import com.pos.identity.repository.RoleRepository;
import com.pos.identity.repository.UserModuleAccessRepository;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.security.PlatformAdminModule;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlatformOperatorProvisionerImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private UserModuleAccessRepository userModuleAccessRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private PlatformOperatorProvisionerImpl provisioner;

    @Test
    void skipsWhenRoleMissing() {
        when(roleRepository.findByName("PLATFORM_ADMIN")).thenReturn(Optional.empty());
        assertEquals(0, provisioner.ensureSeeded());
        verify(userRepository, never()).saveAndFlush(any());
    }

    @Test
    void createsSharedOperatorWhenMissing() {
        Role role = new Role();
        role.setName("PLATFORM_ADMIN");
        when(roleRepository.findByName("PLATFORM_ADMIN")).thenReturn(Optional.of(role));
        when(userRepository.count(any(Specification.class))).thenReturn(0L);
        when(passwordEncoder.encode("password")).thenReturn("hash");
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });

        assertEquals(1, provisioner.ensureSeeded());
        verify(userRepository, times(1)).saveAndFlush(any(User.class));
        verify(userModuleAccessRepository, times(PlatformAdminModule.keys().size())).save(any());
    }

    @Test
    void doesNotDuplicateExistingLogin() {
        Role role = new Role();
        role.setName("PLATFORM_ADMIN");
        when(roleRepository.findByName("PLATFORM_ADMIN")).thenReturn(Optional.of(role));
        when(userRepository.count(any(Specification.class))).thenReturn(1L);

        assertEquals(0, provisioner.ensureSeeded());
        verify(userRepository, never()).saveAndFlush(any());
    }
}

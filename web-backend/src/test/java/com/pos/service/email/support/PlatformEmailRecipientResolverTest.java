package com.pos.service.email.support;

import com.pos.dto.email.SendBroadcastEmailRequest;
import com.pos.entity.Role;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlatformEmailRecipientResolverTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PlatformEmailRecipientResolver resolver;

    @Test
    void emptyAudienceRejected() {
        assertThrows(
            BadRequestException.class,
            () -> resolver.resolve(new SendBroadcastEmailRequest(
                "Hello", "Body", null, null, null, false, null, "uz"
            ))
        );
    }

    @Test
    void resolvesByRolesAndSkipsSuperAdmin() {
        User cashier = user("CASHIER", true);
        User superAdmin = user("SUPER_ADMIN", true);
        when(userRepository.findActiveByRoleName("CASHIER")).thenReturn(List.of(cashier, superAdmin));

        List<User> recipients = resolver.resolve(new SendBroadcastEmailRequest(
            "Hello",
            "Body",
            null,
            List.of("CASHIER"),
            null,
            false,
            null,
            "uz"
        ));

        assertEquals(1, recipients.size());
        assertEquals(cashier.getId(), recipients.get(0).getId());
    }

    private static User user(String roleName, boolean active) {
        Role role = new Role();
        role.setName(roleName);
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setRole(role);
        user.setActive(active);
        user.setEmail(roleName.toLowerCase() + "@example.com");
        return user;
    }
}

package com.pos.identity.service.user.support;

import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.service.support.TenantAccessSupport;
import com.pos.identity.service.support.UserLookupSupport;
import com.pos.identity.support.IdentityUsers;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserAccessPolicyTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserLookupSupport userLookup;
    @Mock
    private TenantAccessSupport tenantAccess;

    @InjectMocks
    private UserAccessPolicy policy;

    @Test
    void hidesPlatformOperatorsFromEveryoneIncludingSuperAdmin() {
        assertFalse(policy.canView(IdentityUsers.user("PLATFORM_ADMIN", null)));
    }

    @Test
    void superAdminCanViewOtherSuperAdminsAndTenantUsers() {
        when(tenantAccess.isSuperAdmin()).thenReturn(true);
        when(tenantAccess.isPlatformOperator()).thenReturn(true);
        assertTrue(policy.canView(IdentityUsers.user("SUPER_ADMIN", null)));
        assertTrue(policy.canView(IdentityUsers.user("ADMIN", 3)));
        assertFalse(policy.canView(IdentityUsers.user("PLATFORM_ADMIN", null)));
    }

    @Test
    void platformOperatorSeesTenantUsersButNotOtherSuperAdminsIfNotSuperAdmin() {
        when(tenantAccess.isSuperAdmin()).thenReturn(false);
        when(tenantAccess.isPlatformOperator()).thenReturn(true);
        assertTrue(policy.canView(IdentityUsers.user("ADMIN", 4)));
        assertFalse(policy.canView(IdentityUsers.user("SUPER_ADMIN", null)));
    }

    @Test
    void tenantAdminSeesOnlyOwnCompany() {
        User actor = IdentityUsers.user("ADMIN", 4);
        when(tenantAccess.isPlatformOperator()).thenReturn(false);
        when(tenantAccess.currentUser()).thenReturn(actor);
        assertTrue(policy.canView(IdentityUsers.user("CASHIER", 4)));
        assertFalse(policy.canView(IdentityUsers.user("CASHIER", 9)));
    }

    @Test
    void cannotAssignPlatformRolesFromUsersApi() {
        assertThrows(BadRequestException.class, () -> policy.assertRoleAllowedForCreate("SUPER_ADMIN"));
        assertThrows(BadRequestException.class, () -> policy.assertRoleAllowedForCreate("PLATFORM_ADMIN"));
        when(tenantAccess.isPlatformOperator()).thenReturn(true);
        assertDoesNotThrow(() -> policy.assertRoleAllowedForCreate("ADMIN"));
        assertDoesNotThrow(() -> policy.assertRoleAllowedForCreate("CASHIER"));
    }

    @Test
    void tenantAdminCannotCreateCompanyAdmin() {
        when(tenantAccess.isPlatformOperator()).thenReturn(false);
        assertThrows(BadRequestException.class, () -> policy.assertRoleAllowedForCreate("ADMIN"));
        assertDoesNotThrow(() -> policy.assertRoleAllowedForCreate("CASHIER"));
    }

    @Test
    void cannotDeletePlatformStaff() {
        UUID actorId = UUID.randomUUID();
        when(tenantAccess.currentUser()).thenReturn(IdentityUsers.user(actorId, "SUPER_ADMIN", null));
        assertThrows(BadRequestException.class, () -> policy.assertDeletable(IdentityUsers.user("SUPER_ADMIN", null)));
        assertThrows(BadRequestException.class, () -> policy.assertDeletable(IdentityUsers.user("PLATFORM_ADMIN", null)));
    }

    @Test
    void platformOperatorCanDeleteTenantStaff() {
        UUID actorId = UUID.randomUUID();
        when(tenantAccess.currentUser()).thenReturn(IdentityUsers.user(actorId, "PLATFORM_ADMIN", null));
        when(tenantAccess.isPlatformOperator()).thenReturn(true);
        assertDoesNotThrow(() -> policy.assertDeletable(IdentityUsers.user("ADMIN", 2)));
        assertDoesNotThrow(() -> policy.assertDeletable(IdentityUsers.user("CASHIER", 2)));
    }

    @Test
    void cannotDeleteOwnAccount() {
        UUID actorId = UUID.randomUUID();
        User actor = IdentityUsers.user(actorId, "ADMIN", 2);
        when(tenantAccess.currentUser()).thenReturn(actor);
        assertThrows(BadRequestException.class, () -> policy.assertDeletable(actor));
    }

    @Test
    void platformOperatorMustSupplyCompanyWhenCreatingTenantUser() {
        when(tenantAccess.isPlatformOperator()).thenReturn(true);
        assertThrows(BadRequestException.class, () -> policy.resolveCompanyIdForCreate(null, "CASHIER"));
        when(tenantAccess.requireCompanyId(8)).thenReturn(8);
        assertEquals(8, policy.resolveCompanyIdForCreate(8, "CASHIER"));
    }
}

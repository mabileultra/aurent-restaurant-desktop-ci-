package com.pos.service.identity.impl;

import com.pos.client.crm.CrmOutboundClient;
import com.pos.dto.identity.internal.UserSyncRequest;
import com.pos.entity.Role;
import com.pos.entity.User;
import com.pos.repository.CompanyRepository;
import com.pos.repository.RoleRepository;
import com.pos.repository.UserRepository;
import com.pos.sales.repository.CashierShiftRepository;
import com.pos.sales.repository.SaleRepository;
import com.pos.security.cache.AuthenticatedUserCache;
import com.pos.service.support.TenantAccessSupport;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IdentityUserSyncServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private CompanyRepository companyRepository;
    @Mock
    private TenantAccessSupport tenantAccess;
    @Mock
    private SaleRepository saleRepository;
    @Mock
    private CashierShiftRepository cashierShiftRepository;
    @Mock
    private CrmOutboundClient crmOutboundClient;
    @Mock
    private AuthenticatedUserCache authenticatedUserCache;
    @Mock
    private EntityManager entityManager;

    private IdentityUserSyncServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new IdentityUserSyncServiceImpl(
            userRepository,
            roleRepository,
            companyRepository,
            tenantAccess,
            saleRepository,
            cashierShiftRepository,
            crmOutboundClient,
            authenticatedUserCache,
            entityManager
        );
    }

    @Test
    void deleteWithSalesClearsPinAndDeactivatesWithoutRemovingRow() {
        UUID id = UUID.randomUUID();
        User user = cashier(id, "cashier", "digest-old");
        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(saleRepository.existsByCashier_Id(id)).thenReturn(true);

        service.sync(deleteRequest(id));

        assertNull(user.getPinDigest());
        assertFalse(user.isActive());
        verify(userRepository).save(user);
        verify(userRepository, never()).delete(org.mockito.ArgumentMatchers.<User>any());
        verify(authenticatedUserCache).evict(id);
    }

    @Test
    void deleteWithoutReferencesRemovesRowAndLeavesPinUntouchedUntilDelete() {
        UUID id = UUID.randomUUID();
        User user = cashier(id, "cashier", "digest-live");
        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(saleRepository.existsByCashier_Id(id)).thenReturn(false);
        when(cashierShiftRepository.existsByCashier_Id(id)).thenReturn(false);
        when(crmOutboundClient.existsOrderByCreator(id)).thenReturn(false);

        service.sync(deleteRequest(id));

        assertEquals("digest-live", user.getPinDigest());
        assertTrue(user.isActive());
        verify(userRepository).delete(user);
        verify(userRepository, never()).save(any());
    }

    @Test
    void upsertKeepsLiveCashierPin() {
        UUID id = UUID.randomUUID();
        User user = cashier(id, "cashier", "digest-live");
        when(userRepository.findByUsernameWithDetails("cashier")).thenReturn(Optional.empty());
        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(roleRepository.findByName("CASHIER")).thenReturn(Optional.of(Role.builder().name("CASHIER").build()));

        service.sync(updateRequest(id, "cashier", "digest-live"));

        assertEquals("digest-live", user.getPinDigest());
        assertTrue(user.isActive());
        verify(userRepository).save(user);
    }

    @Test
    void upsertRenamesLegacyRowAndClearsItsPin() {
        UUID liveId = UUID.randomUUID();
        UUID legacyId = UUID.randomUUID();
        User legacy = cashier(legacyId, "cashier", "digest-old");
        when(userRepository.findByUsernameWithDetails("cashier")).thenReturn(Optional.of(legacy));
        when(saleRepository.existsByCashier_Id(legacyId)).thenReturn(true);
        when(userRepository.findById(liveId)).thenReturn(Optional.of(cashier(liveId, "cashier", "digest-live")));
        when(roleRepository.findByName("CASHIER")).thenReturn(Optional.of(Role.builder().name("CASHIER").build()));

        service.sync(updateRequest(liveId, "cashier", "digest-live"));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository, org.mockito.Mockito.atLeastOnce()).save(saved.capture());
        User freed = saved.getAllValues().stream()
            .filter(row -> legacyId.equals(row.getId()))
            .findFirst()
            .orElseThrow();
        assertNull(freed.getPinDigest());
        assertTrue(freed.getUsername().contains("__legacy__"));
        User live = saved.getAllValues().stream()
            .filter(row -> liveId.equals(row.getId()))
            .findFirst()
            .orElseThrow();
        assertEquals("digest-live", live.getPinDigest());
        assertTrue(live.isActive());
    }

    private static User cashier(UUID id, String username, String pinDigest) {
        User user = User.builder()
            .id(id)
            .username(username)
            .email(username + "@example.com")
            .password("hash")
            .pinDigest(pinDigest)
            .fullName("Cashier")
            .firstName("Cashier")
            .build();
        user.setActive(true);
        return user;
    }

    private static UserSyncRequest deleteRequest(UUID id) {
        return new UserSyncRequest(
            "DELETE", id, null, null, null, null, null, null, null, null, null, null, List.of(), false, false
        );
    }

    private static UserSyncRequest updateRequest(UUID id, String username, String pinDigest) {
        return new UserSyncRequest(
            "UPDATE",
            id,
            username,
            username + "@example.com",
            "hash",
            pinDigest,
            "Cashier",
            "Cashier",
            null,
            null,
            "CASHIER",
            null,
            List.of(),
            true,
            false
        );
    }
}

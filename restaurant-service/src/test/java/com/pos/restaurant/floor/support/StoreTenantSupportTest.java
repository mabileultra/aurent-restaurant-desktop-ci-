package com.pos.restaurant.floor.support;

import com.pos.restaurant.edge.entity.EdgeStaff;
import com.pos.restaurant.edge.entity.EdgeStore;
import com.pos.restaurant.edge.repository.EdgeStaffRepository;
import com.pos.restaurant.edge.repository.EdgeStoreRepository;
import com.pos.restaurant.exception.ForbiddenException;
import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.security.RestaurantTenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StoreTenantSupportTest {

    @Mock private EdgeStoreRepository storeRepository;
    @Mock private EdgeStaffRepository staffRepository;
    @Mock private FloorTenantSupport tenantSupport;
    @Mock private RestaurantStorePresence storePresence;
    @InjectMocks private StoreTenantSupport support;

    @AfterEach
    void clear() {
        RestaurantTenantContext.clear();
    }

    @Test
    void rejectsStoreOfOtherCompany() {
        when(storeRepository.findByIdAndCompanyId(2, 1)).thenReturn(Optional.empty());
        when(storePresence.existsForCompany(1, 2)).thenReturn(false);
        assertThatThrownBy(() -> support.requireStore(1, 2))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void adminMayAccessAnyCompanyStore() {
        RestaurantTenantContext.set(1, UUID.randomUUID(), "ADMIN");
        EdgeStore store = EdgeStore.builder().id(5).companyId(1).name("A").businessType("RESTAURANT").active(true).build();
        when(storeRepository.findByIdAndCompanyId(5, 1)).thenReturn(Optional.of(store));
        assertThat(support.requireStore(1, 5).getId()).isEqualTo(5);
    }

    @Test
    void cloudAllowsStoreWhenEdgeRowMissingButCatalogPresent() {
        RestaurantTenantContext.set(1, UUID.randomUUID(), "ADMIN");
        when(storeRepository.findByIdAndCompanyId(55, 1)).thenReturn(Optional.empty());
        when(storePresence.existsForCompany(1, 55)).thenReturn(true);
        assertThat(support.requireStore(1, 55).getId()).isEqualTo(55);
    }

    @Test
    void staffLimitedToAssignedStores() {
        UUID userId = UUID.randomUUID();
        RestaurantTenantContext.set(1, userId, "MANAGER");
        EdgeStore store = EdgeStore.builder().id(9).companyId(1).name("B").businessType("RESTAURANT").active(true).build();
        when(storeRepository.findByIdAndCompanyId(9, 1)).thenReturn(Optional.of(store));
        when(staffRepository.findById(userId)).thenReturn(Optional.of(
            EdgeStaff.builder().userId(userId).companyId(1).username("m").role("MANAGER")
                .storeIdsJson("[1,2]").active(true).build()
        ));
        assertThatThrownBy(() -> support.requireStore(1, 9))
            .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void staffMayAccessAssignedStore() {
        UUID userId = UUID.randomUUID();
        RestaurantTenantContext.set(1, userId, "WAITER");
        EdgeStore store = EdgeStore.builder().id(2).companyId(1).name("C").businessType("RESTAURANT").active(true).build();
        when(storeRepository.findByIdAndCompanyId(2, 1)).thenReturn(Optional.of(store));
        when(staffRepository.findById(userId)).thenReturn(Optional.of(
            EdgeStaff.builder().userId(userId).companyId(1).username("w").role("WAITER")
                .storeIdsJson("[2]").active(true).build()
        ));
        assertThat(support.requireStore(1, 2).getId()).isEqualTo(2);
    }
}

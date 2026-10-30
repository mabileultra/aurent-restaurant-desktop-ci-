package com.pos.sales.service.sync.impl;

import com.pos.catalog.dto.category.CategoryResponse;
import com.pos.catalog.dto.product.ProductResponse;
import com.pos.catalog.service.CategoryService;
import com.pos.entity.Company;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.repository.UserRepository;
import com.pos.sales.dto.sync.CashierSyncCatalogDeltaResponse;
import com.pos.sales.service.sync.support.CashierCatalogDeltaProductSupport;
import com.pos.service.support.CashierSaleSupport;
import com.pos.service.support.CatalogIsolationSupport;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CashierCatalogDeltaServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private CashierSaleSupport cashierSaleSupport;
    @Mock private CatalogIsolationSupport catalogIsolation;
    @Mock private CategoryService categoryService;
    @Mock private CashierCatalogDeltaProductSupport productSupport;

    @InjectMocks
    private CashierCatalogDeltaServiceImpl service;

    @Test
    void staleSinceReturnsFullResetWithoutProductLoad() {
        UUID cashierId = UUID.randomUUID();
        User cashier = cashier();
        Store store = store();
        when(userRepository.findByIdWithDetails(cashierId)).thenReturn(Optional.of(cashier));
        when(cashierSaleSupport.requireStoreForSale(cashier, 7)).thenReturn(store);

        Instant since = Instant.now().minus(10, ChronoUnit.DAYS);
        CashierSyncCatalogDeltaResponse res = service.delta(7, cashierId, since);

        assertThat(res.fullReset()).isTrue();
        assertThat(res.products()).isEmpty();
        assertThat(res.removedProductIds()).isEmpty();
        verify(productSupport, never()).loadActiveUpserts(any(), any(), any());
        verify(categoryService, never()).findAll(any());
    }

    @Test
    void recentSinceReturnsUpsertsAndRemovals() {
        UUID cashierId = UUID.randomUUID();
        User cashier = cashier();
        Store store = store();
        Instant since = Instant.now().minus(1, ChronoUnit.HOURS);
        UUID removedId = UUID.randomUUID();

        when(userRepository.findByIdWithDetails(cashierId)).thenReturn(Optional.of(cashier));
        when(cashierSaleSupport.requireStoreForSale(cashier, 7)).thenReturn(store);
        when(categoryService.findAll(null)).thenReturn(List.of(
            new CategoryResponse(1, "Drinks", null, null, null, null)
        ));
        when(productSupport.loadActiveUpserts(eq(3), eq(7), eq(since)))
            .thenReturn(List.of(mock(ProductResponse.class)));
        when(productSupport.loadRemovedIds(eq(3), eq(since))).thenReturn(List.of(removedId));

        CashierSyncCatalogDeltaResponse res = service.delta(7, cashierId, since);

        assertThat(res.fullReset()).isFalse();
        assertThat(res.storeId()).isEqualTo(7);
        assertThat(res.categories()).hasSize(1);
        assertThat(res.products()).hasSize(1);
        assertThat(res.removedProductIds()).containsExactly(removedId);
        verify(catalogIsolation).rejectPharmacySalesInMonolith(store);
    }

    private static User cashier() {
        Company company = new Company();
        company.setId(3);
        User user = new User();
        user.setCompany(company);
        return user;
    }

    private static Store store() {
        Company company = new Company();
        company.setId(3);
        Store store = new Store();
        store.setId(7);
        store.setName("Main");
        store.setCompany(company);
        return store;
    }
}

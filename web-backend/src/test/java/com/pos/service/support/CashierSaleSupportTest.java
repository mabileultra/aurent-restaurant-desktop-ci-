package com.pos.service.support;

import com.pos.entity.Company;
import com.pos.entity.Role;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.repository.StoreRepository;
import com.pos.catalog.repository.ProductStorePriceRepository;
import com.pos.security.CurrentUserProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CashierSaleSupportTest {

    private static final Integer STORE_A = 10;
    private static final Integer STORE_B = 20;

    @Mock
    private StoreRepository storeRepository;
    @Mock
    private ProductStorePriceRepository productStorePriceRepository;
    @Mock
    private CurrentUserProvider currentUserProvider;

    private CashierSaleSupport support;

    @BeforeEach
    void setUp() {
        support = new CashierSaleSupport(storeRepository, productStorePriceRepository, currentUserProvider);
    }

    @Test
    void cashier_must_be_assigned_to_store() {
        User cashier = cashierWithStores(STORE_A);
        Store storeB = store(STORE_B);

        when(storeRepository.findById(STORE_B)).thenReturn(Optional.of(storeB));

        assertThrows(BadRequestException.class, () -> support.requireStoreForSale(cashier, STORE_B));
    }

    @Test
    void cashier_without_stores_is_rejected() {
        User cashier = cashierWithStores();
        Store storeA = store(STORE_A);

        when(storeRepository.findById(STORE_A)).thenReturn(Optional.of(storeA));

        assertThrows(BadRequestException.class, () -> support.requireStoreForSale(cashier, STORE_A));
    }

    @Test
    void cashier_can_use_assigned_store() {
        User cashier = cashierWithStores(STORE_A);
        Store storeA = store(STORE_A);

        when(storeRepository.findById(STORE_A)).thenReturn(Optional.of(storeA));

        Store result = support.requireStoreForSale(cashier, STORE_A);

        assertEquals(STORE_A, result.getId());
    }

    private static User cashierWithStores(Integer... storeIds) {
        Company company = Company.builder().id(1).name("Test").build();
        User user = User.builder()
            .id(java.util.UUID.randomUUID())
            .username("cashier1")
            .company(company)
            .role(Role.builder().name("CASHIER").build())
            .build();
        for (Integer storeId : storeIds) {
            user.getStores().add(store(storeId));
        }
        return user;
    }

    private static Store store(Integer id) {
        return Store.builder()
            .id(id)
            .name("Store " + id)
            .company(Company.builder().id(1).name("Test").build())
            .build();
    }
}

package com.pos.inventory.service.stock.support;

import com.pos.entity.Company;
import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.repository.StoreRepository;
import com.pos.service.support.TenantAccessSupport;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockTransferStoreGuardTest {

    @Mock StoreRepository storeRepository;
    @Mock TenantAccessSupport tenantAccess;
    @InjectMocks StockTransferStoreGuard storeGuard;

    @Test
    void rejectSameStore() {
        assertThrows(BadRequestException.class, () -> storeGuard.requireSameCompanyPair(1, 1));
    }

    @Test
    void rejectDifferentCompany() {
        Company a = Company.builder().id(10).build();
        Company b = Company.builder().id(20).build();
        when(storeRepository.findById(1)).thenReturn(Optional.of(Store.builder().id(1).company(a).build()));
        when(storeRepository.findById(2)).thenReturn(Optional.of(Store.builder().id(2).company(b).build()));
        assertThrows(BadRequestException.class, () -> storeGuard.requireSameCompanyPair(1, 2));
    }
}

package com.pos.sales.service.impl;

import com.pos.sales.dto.cashregister.CashRegisterRowResponse;
import com.pos.sales.entity.CashRegister;
import com.pos.entity.Company;
import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.sales.mapper.CashRegisterMapper;
import com.pos.sales.repository.CashRegisterRepository;
import com.pos.repository.StoreRepository;
import com.pos.service.support.TenantAccessSupport;
import com.pos.sales.support.CashRegisterStatusToggle;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CashRegisterServiceToggleStatusTest {

    @Mock
    private CashRegisterRepository cashRegisterRepository;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private CashRegisterMapper cashRegisterMapper;
    @Mock
    private TenantAccessSupport tenantAccess;
    @Spy
    private CashRegisterStatusToggle cashRegisterStatusToggle = new CashRegisterStatusToggle();

    @InjectMocks
    private CashRegisterServiceImpl service;

    @Test
    void disableClearsDeviceIdSoLaptopCanRebind() {
        Store store = accessibleStore();
        CashRegister register = CashRegister.builder()
            .id(4L)
            .store(store)
            .status("ACTIVE")
            .deviceId("laptop-1")
            .registerNumber(2)
            .build();
        CashRegisterRowResponse mapped = new CashRegisterRowResponse(
            4L, 10, "Shop", 2, null, null, null, null, null, "INACTIVE"
        );
        when(cashRegisterRepository.findDetailById(4L)).thenReturn(Optional.of(register));
        when(cashRegisterRepository.save(register)).thenReturn(register);
        when(cashRegisterMapper.toRowResponse(register)).thenReturn(mapped);

        CashRegisterRowResponse response = service.toggleStatus(4L);

        assertThat(register.getStatus()).isEqualTo("INACTIVE");
        assertThat(register.getDeviceId()).isNull();
        assertThat(response.status()).isEqualTo("INACTIVE");
        verify(tenantAccess).assertCanAccessStore(store);
        verify(cashRegisterStatusToggle).apply(register);
    }

    @Test
    void enableDoesNotClearDeviceId() {
        Store store = accessibleStore();
        CashRegister register = CashRegister.builder()
            .id(4L)
            .store(store)
            .status("INACTIVE")
            .deviceId("legacy")
            .registerNumber(1)
            .build();
        when(cashRegisterRepository.findDetailById(4L)).thenReturn(Optional.of(register));
        when(cashRegisterRepository.save(register)).thenReturn(register);
        when(cashRegisterMapper.toRowResponse(register)).thenReturn(
            new CashRegisterRowResponse(4L, 10, "Shop", 1, null, null, null, "legacy", null, "ACTIVE")
        );

        service.toggleStatus(4L);

        assertThat(register.getStatus()).isEqualTo("ACTIVE");
        assertThat(register.getDeviceId()).isEqualTo("legacy");
    }

    @Test
    void throwsWhenRegisterMissing() {
        when(cashRegisterRepository.findDetailById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.toggleStatus(99L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage("Cash register not found: 99");
    }

    @Test
    void throwsWhenStoreUnavailable() {
        CashRegister register = CashRegister.builder()
            .id(4L)
            .store(Store.builder().id(10).active(false).build())
            .status("ACTIVE")
            .build();
        when(cashRegisterRepository.findDetailById(4L)).thenReturn(Optional.of(register));

        assertThatThrownBy(() -> service.toggleStatus(4L))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Cash register store is not available");
    }

    private static Store accessibleStore() {
        return Store.builder()
            .id(10)
            .name("Shop")
            .active(true)
            .company(Company.builder().id(1).build())
            .build();
    }
}

package com.pos.sales.service.impl;

import com.pos.sales.dto.cashregister.UpsertCashRegisterRequest;
import com.pos.sales.entity.CashRegister;
import com.pos.entity.Company;
import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.sales.mapper.CashRegisterMapper;
import com.pos.sales.repository.CashRegisterRepository;
import com.pos.repository.StoreRepository;
import com.pos.service.support.TenantAccessSupport;
import com.pos.sales.support.CashRegisterStatusToggle;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CashRegisterServiceDeviceIdTest {

    @Mock
    private CashRegisterRepository cashRegisterRepository;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private CashRegisterMapper cashRegisterMapper;
    @Mock
    private TenantAccessSupport tenantAccess;
    @Mock
    private CashRegisterStatusToggle cashRegisterStatusToggle;

    @InjectMocks
    private CashRegisterServiceImpl service;

    @Test
    void createRejectsDeviceIdAlreadyBoundToAnotherRegister() {
        Store store = accessibleStore();
        when(storeRepository.findById(10)).thenReturn(Optional.of(store));
        when(cashRegisterRepository.existsByStore_IdAndRegisterNumber(10, 1)).thenReturn(false);
        when(cashRegisterRepository.existsByDeviceId("laptop-1")).thenReturn(true);

        assertThatThrownBy(() -> service.create(new UpsertCashRegisterRequest(
            10, 1, null, null, null, "laptop-1", null
        )))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Касса с таким deviceId уже зарегистрирована");
        verify(cashRegisterRepository, never()).save(any());
    }

    @Test
    void updateRejectsDeviceIdBoundToAnotherRegister() {
        Store store = accessibleStore();
        CashRegister current = CashRegister.builder()
            .id(2L)
            .store(store)
            .registerNumber(2)
            .build();
        when(cashRegisterRepository.findDetailById(2L)).thenReturn(Optional.of(current));
        when(storeRepository.findById(10)).thenReturn(Optional.of(store));
        when(cashRegisterRepository.existsByStore_IdAndRegisterNumberAndIdNot(10, 2, 2L)).thenReturn(false);
        when(cashRegisterRepository.existsByDeviceIdAndIdNot("laptop-1", 2L)).thenReturn(true);

        assertThatThrownBy(() -> service.update(2L, new UpsertCashRegisterRequest(
            10, 2, null, null, null, "  laptop-1  ", null
        )))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Касса с таким deviceId уже зарегистрирована");
        verify(cashRegisterRepository, never()).save(any());
    }

    @Test
    void createAllowsBlankDeviceIdWithoutUniquenessCheck() {
        Store store = accessibleStore();
        when(storeRepository.findById(10)).thenReturn(Optional.of(store));
        when(cashRegisterRepository.existsByStore_IdAndRegisterNumber(10, 1)).thenReturn(false);
        when(cashRegisterRepository.save(any(CashRegister.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(cashRegisterMapper.toRowResponse(any())).thenReturn(null);

        service.create(new UpsertCashRegisterRequest(10, 1, null, null, null, "  ", null));

        verify(cashRegisterRepository, never()).existsByDeviceId(any());
        verify(cashRegisterRepository).save(any(CashRegister.class));
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

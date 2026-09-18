package com.pos.sales.service.impl;

import com.pos.sales.dto.cashregister.RegisterTerminalRequest;
import com.pos.sales.dto.cashregister.RegisterTerminalResponse;
import com.pos.sales.entity.CashRegister;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.sales.support.CashRegisterTerminalResolver;
import com.pos.sales.support.TerminalResolveResult;
import com.pos.security.CurrentUserProvider;
import com.pos.service.support.CashierSaleSupport;
import com.pos.service.support.TenantAccessSupport;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CashRegisterTerminalServiceImplTest {

    @Mock
    private CashierSaleSupport cashierSaleSupport;
    @Mock
    private CurrentUserProvider currentUserProvider;
    @Mock
    private TenantAccessSupport tenantAccess;
    @Mock
    private CashRegisterTerminalResolver cashRegisterTerminalResolver;

    @InjectMocks
    private CashRegisterTerminalServiceImpl service;

    @Test
    void registerForStoreMapsResolvedRegister() {
        User cashier = User.builder().id(UUID.randomUUID()).build();
        Store store = Store.builder().id(10).name("Shop").build();
        RegisterTerminalRequest request = new RegisterTerminalRequest("laptop-1", "SN", null, null, null);
        CashRegister register = CashRegister.builder()
            .id(5L)
            .registerNumber(2)
            .equipmentSerial("SN")
            .deviceId("laptop-1")
            .store(store)
            .build();
        when(currentUserProvider.requireCurrentUser()).thenReturn(cashier);
        when(cashierSaleSupport.requireStoreForSale(cashier, 10)).thenReturn(store);
        when(cashRegisterTerminalResolver.resolve(store, request))
            .thenReturn(new TerminalResolveResult(register, true));

        RegisterTerminalResponse response = service.registerForStore(10, request);

        verify(tenantAccess).assertCanAccessStore(store);
        assertThat(response.cashRegisterId()).isEqualTo(5L);
        assertThat(response.registerNumber()).isEqualTo(2);
        assertThat(response.equipmentSerial()).isEqualTo("SN");
        assertThat(response.deviceId()).isEqualTo("laptop-1");
        assertThat(response.created()).isTrue();
    }

    @Test
    void resolveActiveRegisterReturnsEntityFromResolver() {
        User cashier = User.builder().id(UUID.randomUUID()).build();
        Store store = Store.builder().id(10).build();
        RegisterTerminalRequest request = new RegisterTerminalRequest("laptop-1", null, null, null, null);
        CashRegister register = CashRegister.builder().id(9L).store(store).build();
        when(currentUserProvider.requireCurrentUser()).thenReturn(cashier);
        when(cashierSaleSupport.requireStoreForSale(cashier, 10)).thenReturn(store);
        when(cashRegisterTerminalResolver.resolve(store, request))
            .thenReturn(new TerminalResolveResult(register, false));

        CashRegister resolved = service.resolveActiveRegister(10, request);

        verify(tenantAccess).assertCanAccessStore(store);
        assertThat(resolved).isSameAs(register);
    }

    @Test
    void doesNotResolveWhenStoreAccessDenied() {
        User cashier = User.builder().id(UUID.randomUUID()).build();
        Store store = Store.builder().id(10).build();
        RegisterTerminalRequest request = new RegisterTerminalRequest("laptop-1", null, null, null, null);
        when(currentUserProvider.requireCurrentUser()).thenReturn(cashier);
        when(cashierSaleSupport.requireStoreForSale(cashier, 10)).thenReturn(store);
        doThrow(new BadRequestException("no access")).when(tenantAccess).assertCanAccessStore(store);

        assertThatThrownBy(() -> service.registerForStore(10, request))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("no access");
        verify(cashRegisterTerminalResolver, never()).resolve(store, request);
    }
}

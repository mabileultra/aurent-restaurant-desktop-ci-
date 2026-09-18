package com.pos.sales.support;

import com.pos.sales.entity.CashRegister;
import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.sales.repository.CashRegisterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static com.pos.sales.support.CashRegisterTerminalFixtures.device;
import static com.pos.sales.support.CashRegisterTerminalFixtures.register;
import static com.pos.sales.support.CashRegisterTerminalFixtures.store;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CashRegisterTerminalResolverRejectTest {

    @Mock
    private CashRegisterRepository cashRegisterRepository;

    private CashRegisterTerminalResolver resolver;
    private Store shop;

    @BeforeEach
    void setUp() {
        resolver = new CashRegisterTerminalResolver(
            cashRegisterRepository,
            new CashRegisterTerminalLookup(cashRegisterRepository)
        );
        shop = store(10);
    }

    @Test
    void requiresDeviceIdOrSerial() {
        assertThatThrownBy(() -> resolver.resolve(shop, device("  ")))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Укажите deviceId или серийный номер терминала");
        verify(cashRegisterRepository, never()).findByDeviceId(any());
        verify(cashRegisterRepository, never()).save(any());
    }

    @Test
    void rejectsNullRequestWithoutIdentity() {
        assertThatThrownBy(() -> resolver.resolve(shop, null))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Укажите deviceId или серийный номер терминала");
    }

    @Test
    void rejectsActiveRegisterFromAnotherStoreAndKeepsBinding() {
        Store other = store(99);
        CashRegister foreign = register(other, 8L, 1, "ACTIVE", "laptop-1");
        when(cashRegisterRepository.findByDeviceId("laptop-1")).thenReturn(Optional.of(foreign));

        assertThatThrownBy(() -> resolver.resolve(shop, device("laptop-1")))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Эта касса зарегистрирована в другом магазине");
        verify(cashRegisterRepository, never()).saveAndFlush(any());
        verify(cashRegisterRepository, never()).save(any());
        verify(cashRegisterRepository, never()).findUnboundByStoreAndStatus(any(), any());
    }

    @Test
    void rejectsActiveRegisterWithMissingStore() {
        CashRegister orphan = CashRegister.builder()
            .id(9L)
            .registerNumber(1)
            .deviceId("laptop-1")
            .status("ACTIVE")
            .build();
        when(cashRegisterRepository.findByDeviceId("laptop-1")).thenReturn(Optional.of(orphan));

        assertThatThrownBy(() -> resolver.resolve(shop, device("laptop-1")))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Эта касса зарегистрирована в другом магазине");
    }

    @Test
    void throwsWhenInactiveBindingHasNoActiveRegisterInStore() {
        CashRegister disabled = register(shop, 2L, 2, "INACTIVE", "laptop-1");
        when(cashRegisterRepository.findByDeviceId("laptop-1")).thenReturn(Optional.of(disabled));
        when(cashRegisterRepository.saveAndFlush(disabled)).thenReturn(disabled);
        when(cashRegisterRepository.findUnboundByStoreAndStatus(10, "ACTIVE")).thenReturn(List.of());
        when(cashRegisterRepository.countByStore_IdAndStatusIgnoreCase(10, "ACTIVE")).thenReturn(0L);

        assertThatThrownBy(() -> resolver.resolve(shop, device("laptop-1")))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Касса отключена администратором");
        verify(cashRegisterRepository, never()).findMaxRegisterNumberByStoreId(any());
        verify(cashRegisterRepository, never()).save(any());
    }

    @Test
    void throwsWhenActiveRegistersAreOccupiedByOtherDevices() {
        CashRegister disabled = register(shop, 2L, 2, "INACTIVE", "laptop-1");
        when(cashRegisterRepository.findByDeviceId("laptop-1")).thenReturn(Optional.of(disabled));
        when(cashRegisterRepository.saveAndFlush(disabled)).thenReturn(disabled);
        when(cashRegisterRepository.findUnboundByStoreAndStatus(10, "ACTIVE")).thenReturn(List.of());
        when(cashRegisterRepository.countByStore_IdAndStatusIgnoreCase(10, "ACTIVE")).thenReturn(2L);

        assertThatThrownBy(() -> resolver.resolve(shop, device("laptop-1")))
            .isInstanceOf(BadRequestException.class)
            .hasMessage(
                "Активная касса уже зарегистрирована на другом устройстве. "
                    + "Выключите ту кассу в списке или очистите ID устройства"
            );
        verify(cashRegisterRepository, never()).findMaxRegisterNumberByStoreId(any());
    }

    @Test
    void doesNotCreateDuplicateAfterReleasingInactiveBinding() {
        CashRegister disabled = register(shop, 2L, 2, "INACTIVE", "laptop-1");
        when(cashRegisterRepository.findByDeviceId("laptop-1")).thenReturn(Optional.of(disabled));
        when(cashRegisterRepository.saveAndFlush(disabled)).thenReturn(disabled);
        when(cashRegisterRepository.findUnboundByStoreAndStatus(10, "ACTIVE")).thenReturn(List.of());
        when(cashRegisterRepository.countByStore_IdAndStatusIgnoreCase(10, "ACTIVE")).thenReturn(1L);

        assertThatThrownBy(() -> resolver.resolve(shop, device("laptop-1")))
            .isInstanceOf(BadRequestException.class);
        verify(cashRegisterRepository, never()).save(any(CashRegister.class));
    }
}

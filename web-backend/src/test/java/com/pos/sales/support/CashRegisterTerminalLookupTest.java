package com.pos.sales.support;

import com.pos.sales.entity.CashRegister;
import com.pos.sales.repository.CashRegisterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CashRegisterTerminalLookupTest {

    @Mock
    private CashRegisterRepository cashRegisterRepository;

    private CashRegisterTerminalLookup lookup;

    @BeforeEach
    void setUp() {
        lookup = new CashRegisterTerminalLookup(cashRegisterRepository);
    }

    @Test
    void findByDeviceIdSkipsBlankAndNull() {
        assertThat(lookup.findByDeviceId("  ")).isEmpty();
        assertThat(lookup.findByDeviceId(null)).isEmpty();
        verify(cashRegisterRepository, never()).findByDeviceId("  ");
        verify(cashRegisterRepository, never()).findByDeviceId(null);
    }

    @Test
    void findByDeviceIdDelegatesToRepository() {
        CashRegister register = CashRegister.builder().id(3L).build();
        when(cashRegisterRepository.findByDeviceId("dev-1")).thenReturn(Optional.of(register));

        assertThat(lookup.findByDeviceId("dev-1")).contains(register);
    }

    @Test
    void findActiveBySerialSkipsBlank() {
        assertThat(lookup.findActiveBySerial(10, " ")).isEmpty();
        assertThat(lookup.findActiveBySerial(10, null)).isEmpty();
        verify(cashRegisterRepository, never())
            .findByStore_IdAndEquipmentSerialIgnoreCaseAndStatusIgnoreCase(10, " ", "ACTIVE");
    }

    @Test
    void findActiveBySerialLooksUpActiveOnly() {
        CashRegister register = CashRegister.builder().id(4L).build();
        when(cashRegisterRepository.findByStore_IdAndEquipmentSerialIgnoreCaseAndStatusIgnoreCase(
            10, "SN-1", "ACTIVE"
        )).thenReturn(Optional.of(register));

        assertThat(lookup.findActiveBySerial(10, "SN-1")).contains(register);
    }

    @Test
    void findActiveUnboundReturnsNewestFirst() {
        CashRegister first = CashRegister.builder().id(1L).build();
        CashRegister second = CashRegister.builder().id(2L).build();
        when(cashRegisterRepository.findUnboundByStoreAndStatus(4, "ACTIVE"))
            .thenReturn(List.of(first, second));

        assertThat(lookup.findActiveUnbound(4)).contains(first);
    }

    @Test
    void findActiveUnboundEmptyWhenNone() {
        when(cashRegisterRepository.findUnboundByStoreAndStatus(4, "ACTIVE")).thenReturn(List.of());

        assertThat(lookup.findActiveUnbound(4)).isEmpty();
    }

    @Test
    void countActiveDelegatesToRepository() {
        when(cashRegisterRepository.countByStore_IdAndStatusIgnoreCase(8, "ACTIVE")).thenReturn(3L);

        assertThat(lookup.countActive(8)).isEqualTo(3L);
    }

    @Test
    void isActiveAcceptsOnlyActiveStatus() {
        assertThat(CashRegisterTerminalLookup.isActive(null)).isFalse();
        assertThat(CashRegisterTerminalLookup.isActive(CashRegister.builder().status("INACTIVE").build())).isFalse();
        assertThat(CashRegisterTerminalLookup.isActive(CashRegister.builder().status("ACTIVE").build())).isTrue();
        assertThat(CashRegisterTerminalLookup.isActive(CashRegister.builder().status("active").build())).isTrue();
    }
}

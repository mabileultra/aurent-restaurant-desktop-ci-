package com.pos.sales.support;

import com.pos.entity.Company;
import com.pos.entity.Store;
import com.pos.exception.ConflictException;
import com.pos.integrations.fiscal.support.FiscalModuleField;
import com.pos.integrations.fiscal.support.InMemoryFiscalModuleOwners;
import com.pos.sales.entity.CashRegister;
import com.pos.sales.repository.CashRegisterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static com.pos.sales.support.CashRegisterTerminalFixtures.full;
import static com.pos.sales.support.CashRegisterTerminalFixtures.register;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** AUR-19: fiscalCardId из /cashier/terminal/register (heartbeat и авто-регистрация). */
@ExtendWith(MockitoExtension.class)
class CashRegisterTerminalResolverFiscalCardTest {

    @Mock
    private CashRegisterRepository cashRegisterRepository;

    private CashRegisterTerminalResolver resolver;
    private InMemoryFiscalModuleOwners fm;
    private Store shop;
    private CashRegister owner;

    @BeforeEach
    void setUp() {
        shop = Store.builder().id(10).name("Центральный").active(true)
            .company(Company.builder().id(1).build()).build();
        owner = register(shop, 5L, 2, "ACTIVE", "laptop-owner");
        fm = new InMemoryFiscalModuleOwners().register(owner)
            .bind(FiscalModuleField.CASH_REGISTER_FISCAL_CARD_ID, 5L, "YZ231006044579");
        resolver = new CashRegisterTerminalResolver(
            cashRegisterRepository,
            new CashRegisterTerminalLookup(cashRegisterRepository),
            fm.guard()
        );
    }

    @Test
    void heartbeatOfExistingRegisterWithForeignModuleIsConflictWithoutChanges() {
        CashRegister bound = register(shop, 1L, 1, "ACTIVE", "laptop-1");
        fm.register(bound);
        when(cashRegisterRepository.findByDeviceId("laptop-1")).thenReturn(Optional.of(bound));

        ConflictException ex = catchThrowableOfType(
            () -> resolver.resolve(shop, full("laptop-1", "SN-NEW", "M-NEW", " yz231006044579 ", "PC-NEW")),
            ConflictException.class
        );

        assertThat(ex.getMessage())
            .isEqualTo("Фискальный модуль «yz231006044579» уже привязан к кассе №2 (Магазин: «Центральный»)");
        assertThat(bound.getFiscalCardId()).isEqualTo("old-fiscal");
        assertThat(bound.getEquipmentSerial()).isEqualTo("old-sn");
        assertThat(bound.getLastSeenAt()).isNull();
        verify(cashRegisterRepository, never()).save(any());
        verify(cashRegisterRepository, never()).saveAndFlush(any());
    }

    @Test
    void autoRegistrationOfNewRegisterWithForeignModuleIsConflictWithoutChanges() {
        when(cashRegisterRepository.findByDeviceId("laptop-new")).thenReturn(Optional.empty());
        when(cashRegisterRepository.findUnboundByStoreAndStatus(10, "ACTIVE")).thenReturn(List.of());

        ConflictException ex = catchThrowableOfType(
            () -> resolver.resolve(shop, full("laptop-new", null, null, "YZ231006044579", null)),
            ConflictException.class
        );

        assertThat(ex.getMessage()).contains("кассе №2");
        verify(cashRegisterRepository, never()).findMaxRegisterNumberByStoreId(any());
        verify(cashRegisterRepository, never()).save(any());
    }

    @Test
    void rebindFromAnotherStoreWithForeignModuleKeepsOldDeviceBinding() {
        Store pharmacy = Store.builder().id(15).name("Аптека").active(true)
            .company(Company.builder().id(1).build()).build();
        CashRegister foreign = register(pharmacy, 16L, 3, "ACTIVE", "laptop-1");
        CashRegister local = register(shop, 1L, 1, "ACTIVE", null);
        fm.register(local);
        when(cashRegisterRepository.findByDeviceId("laptop-1")).thenReturn(Optional.of(foreign));
        when(cashRegisterRepository.findUnboundByStoreAndStatus(10, "ACTIVE")).thenReturn(List.of(local));

        catchThrowableOfType(
            () -> resolver.resolve(shop, full("laptop-1", null, null, "yz231006044579", null)),
            ConflictException.class
        );

        assertThat(foreign.getDeviceId()).isEqualTo("laptop-1");
        assertThat(local.getDeviceId()).isNull();
        verify(cashRegisterRepository, never()).saveAndFlush(any());
        verify(cashRegisterRepository, never()).save(any());
    }

    @Test
    void repeatedHeartbeatWithOwnModulePasses() {
        when(cashRegisterRepository.findByDeviceId("laptop-owner")).thenReturn(Optional.of(owner));
        when(cashRegisterRepository.save(owner)).thenReturn(owner);

        TerminalResolveResult result =
            resolver.resolve(shop, full("laptop-owner", null, null, " yz231006044579 ", null));

        assertThat(result.register()).isSameAs(owner);
        assertThat(owner.getFiscalCardId()).isEqualTo("yz231006044579");
    }

    @Test
    void autoRegistrationWithFreeModuleCreatesRegister() {
        when(cashRegisterRepository.findByDeviceId("laptop-new")).thenReturn(Optional.empty());
        when(cashRegisterRepository.findUnboundByStoreAndStatus(10, "ACTIVE")).thenReturn(List.of());
        when(cashRegisterRepository.findMaxRegisterNumberByStoreId(10)).thenReturn(2);
        when(cashRegisterRepository.save(any(CashRegister.class))).thenAnswer(inv -> inv.getArgument(0));

        TerminalResolveResult result = resolver.resolve(shop, full("laptop-new", null, null, "YZ-FREE", null));

        assertThat(result.created()).isTrue();
        assertThat(result.register().getFiscalCardId()).isEqualTo("YZ-FREE");
    }
}

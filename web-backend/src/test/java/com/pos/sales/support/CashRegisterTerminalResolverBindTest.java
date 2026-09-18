package com.pos.sales.support;

import com.pos.sales.entity.CashRegister;
import com.pos.entity.Store;
import com.pos.sales.repository.CashRegisterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static com.pos.sales.support.CashRegisterTerminalFixtures.device;
import static com.pos.sales.support.CashRegisterTerminalFixtures.full;
import static com.pos.sales.support.CashRegisterTerminalFixtures.register;
import static com.pos.sales.support.CashRegisterTerminalFixtures.serial;
import static com.pos.sales.support.CashRegisterTerminalFixtures.store;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CashRegisterTerminalResolverBindTest {

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
    void reusesActiveRegisterBoundToThisDeviceAndSkipsRebind() {
        CashRegister bound = register(shop, 1L, 1, "ACTIVE", "laptop-1");
        when(cashRegisterRepository.findByDeviceId("laptop-1")).thenReturn(Optional.of(bound));
        when(cashRegisterRepository.save(bound)).thenReturn(bound);

        TerminalResolveResult result = resolver.resolve(shop, device("laptop-1"));

        assertThat(result.created()).isFalse();
        assertThat(result.register().getId()).isEqualTo(1L);
        assertThat(result.register().getLastSeenAt()).isNotNull();
        verify(cashRegisterRepository, never()).saveAndFlush(any());
        verify(cashRegisterRepository, never()).findUnboundByStoreAndStatus(any(), any());
        verify(cashRegisterRepository, never()).findMaxRegisterNumberByStoreId(any());
    }

    @Test
    void treatsLowercaseActiveAsBoundAndDoesNotRelease() {
        CashRegister bound = register(shop, 1L, 1, "active", "laptop-1");
        when(cashRegisterRepository.findByDeviceId("laptop-1")).thenReturn(Optional.of(bound));
        when(cashRegisterRepository.save(bound)).thenReturn(bound);

        TerminalResolveResult result = resolver.resolve(shop, device("  laptop-1  "));

        assertThat(result.register().getId()).isEqualTo(1L);
        verify(cashRegisterRepository).findByDeviceId("laptop-1");
        verify(cashRegisterRepository, never()).saveAndFlush(any());
    }

    @Test
    void rebindsLaptopToEnabledUnboundRegisterAfterAdminDisablesOldOne() {
        CashRegister disabled = register(shop, 2L, 2, "INACTIVE", "laptop-1");
        CashRegister enabled = register(shop, 1L, 1, "ACTIVE", null);
        when(cashRegisterRepository.findByDeviceId("laptop-1")).thenReturn(Optional.of(disabled));
        when(cashRegisterRepository.saveAndFlush(disabled)).thenReturn(disabled);
        when(cashRegisterRepository.findUnboundByStoreAndStatus(10, "ACTIVE")).thenReturn(List.of(enabled));
        when(cashRegisterRepository.save(enabled)).thenReturn(enabled);

        TerminalResolveResult result = resolver.resolve(shop, device("laptop-1"));

        assertThat(disabled.getDeviceId()).isNull();
        assertThat(result.created()).isFalse();
        assertThat(result.register().getId()).isEqualTo(1L);
        assertThat(enabled.getDeviceId()).isEqualTo("laptop-1");
        InOrder order = inOrder(cashRegisterRepository);
        order.verify(cashRegisterRepository).saveAndFlush(disabled);
        order.verify(cashRegisterRepository).save(enabled);
    }

    @Test
    void rebindsInactiveForeignRegisterToLocalUnbound() {
        Store other = store(99);
        CashRegister disabledElsewhere = register(other, 8L, 1, "inactive", "laptop-1");
        CashRegister local = register(shop, 3L, 1, "ACTIVE", null);
        when(cashRegisterRepository.findByDeviceId("laptop-1")).thenReturn(Optional.of(disabledElsewhere));
        when(cashRegisterRepository.saveAndFlush(disabledElsewhere)).thenReturn(disabledElsewhere);
        when(cashRegisterRepository.findUnboundByStoreAndStatus(10, "ACTIVE")).thenReturn(List.of(local));
        when(cashRegisterRepository.save(local)).thenReturn(local);

        TerminalResolveResult result = resolver.resolve(shop, device("laptop-1"));

        assertThat(disabledElsewhere.getDeviceId()).isNull();
        assertThat(result.register().getId()).isEqualTo(3L);
        assertThat(local.getDeviceId()).isEqualTo("laptop-1");
    }

    @Test
    void prefersActiveSerialMatchOverUnboundRegister() {
        CashRegister disabled = register(shop, 2L, 2, "INACTIVE", "laptop-1");
        CashRegister bySerial = register(shop, 4L, 4, "ACTIVE", null);
        bySerial.setEquipmentSerial("SN-44");
        CashRegister unbound = register(shop, 1L, 1, "ACTIVE", null);
        when(cashRegisterRepository.findByDeviceId("laptop-1")).thenReturn(Optional.of(disabled));
        when(cashRegisterRepository.saveAndFlush(disabled)).thenReturn(disabled);
        when(cashRegisterRepository.findByStore_IdAndEquipmentSerialIgnoreCaseAndStatusIgnoreCase(
            10, "SN-44", "ACTIVE"
        )).thenReturn(Optional.of(bySerial));
        when(cashRegisterRepository.save(bySerial)).thenReturn(bySerial);

        TerminalResolveResult result = resolver.resolve(shop, full("laptop-1", "SN-44", null, null, null));

        assertThat(result.register().getId()).isEqualTo(4L);
        assertThat(bySerial.getDeviceId()).isEqualTo("laptop-1");
        verify(cashRegisterRepository, never()).findUnboundByStoreAndStatus(any(), any());
        verify(cashRegisterRepository, never()).save(eq(unbound));
    }

    @Test
    void bindsFirstLoginToExistingUnboundRegisterInsteadOfCreatingAnother() {
        CashRegister unbound = register(shop, 5L, 1, "ACTIVE", null);
        when(cashRegisterRepository.findByDeviceId("laptop-1")).thenReturn(Optional.empty());
        when(cashRegisterRepository.findUnboundByStoreAndStatus(10, "ACTIVE")).thenReturn(List.of(unbound));
        when(cashRegisterRepository.save(unbound)).thenReturn(unbound);

        TerminalResolveResult result = resolver.resolve(shop, device("laptop-1"));

        assertThat(result.created()).isFalse();
        assertThat(result.register().getId()).isEqualTo(5L);
        assertThat(unbound.getDeviceId()).isEqualTo("laptop-1");
        verify(cashRegisterRepository, never()).findMaxRegisterNumberByStoreId(any());
    }

    @Test
    void bindsBySerialOnlyWhenDeviceIdMissing() {
        CashRegister bySerial = register(shop, 7L, 1, "ACTIVE", null);
        when(cashRegisterRepository.findByStore_IdAndEquipmentSerialIgnoreCaseAndStatusIgnoreCase(
            10, "YZ-1", "ACTIVE"
        )).thenReturn(Optional.of(bySerial));
        when(cashRegisterRepository.save(bySerial)).thenReturn(bySerial);

        TerminalResolveResult result = resolver.resolve(shop, serial("YZ-1"));

        assertThat(result.register().getId()).isEqualTo(7L);
        verify(cashRegisterRepository, never()).findByDeviceId(any());
        assertThat(bySerial.getDeviceId()).isNull();
    }

    @Test
    void heartbeatWritesNonBlankMetadataAndKeepsPreviousWhenBlank() {
        CashRegister bound = register(shop, 1L, 1, "ACTIVE", "laptop-1");
        when(cashRegisterRepository.findByDeviceId("laptop-1")).thenReturn(Optional.of(bound));
        when(cashRegisterRepository.save(bound)).thenReturn(bound);

        resolver.resolve(shop, full("laptop-1", "  SN-9  ", "  MK-2  ", "  FC-3  ", "  Desk  "));

        assertThat(bound.getEquipmentSerial()).isEqualTo("SN-9");
        assertThat(bound.getEquipmentModel()).isEqualTo("MK-2");
        assertThat(bound.getFiscalCardId()).isEqualTo("FC-3");
        assertThat(bound.getWorkstationName()).isEqualTo("Desk");

        resolver.resolve(shop, device("laptop-1"));

        assertThat(bound.getEquipmentSerial()).isEqualTo("SN-9");
        assertThat(bound.getEquipmentModel()).isEqualTo("MK-2");
        assertThat(bound.getFiscalCardId()).isEqualTo("FC-3");
        assertThat(bound.getWorkstationName()).isEqualTo("Desk");
    }

    @Test
    void createsRegisterWhenStoreHasNoneAndCopiesIdentity() {
        when(cashRegisterRepository.findByDeviceId("laptop-1")).thenReturn(Optional.empty());
        when(cashRegisterRepository.findUnboundByStoreAndStatus(10, "ACTIVE")).thenReturn(List.of());
        when(cashRegisterRepository.findMaxRegisterNumberByStoreId(10)).thenReturn(4);
        when(cashRegisterRepository.save(any(CashRegister.class))).thenAnswer(invocation -> {
            CashRegister created = invocation.getArgument(0);
            created.setId(11L);
            return created;
        });

        TerminalResolveResult result = resolver.resolve(
            shop,
            full("laptop-1", " SN-1 ", " Model-A ", " FC-1 ", " MacBook ")
        );

        ArgumentCaptor<CashRegister> captor = ArgumentCaptor.forClass(CashRegister.class);
        verify(cashRegisterRepository).save(captor.capture());
        CashRegister created = captor.getValue();
        assertThat(result.created()).isTrue();
        assertThat(result.register().getId()).isEqualTo(11L);
        assertThat(created.getRegisterNumber()).isEqualTo(5);
        assertThat(created.getDeviceId()).isEqualTo("laptop-1");
        assertThat(created.getEquipmentSerial()).isEqualTo("SN-1");
        assertThat(created.getEquipmentModel()).isEqualTo("Model-A");
        assertThat(created.getFiscalCardId()).isEqualTo("FC-1");
        assertThat(created.getWorkstationName()).isEqualTo("MacBook");
        assertThat(created.getStatus()).isEqualTo("ACTIVE");
        assertThat(created.getStore()).isSameAs(shop);
        assertThat(created.getLastSeenAt()).isNotNull();
    }

    @Test
    void createsBySerialWhenDeviceIdMissingAndNothingToBind() {
        when(cashRegisterRepository.findByStore_IdAndEquipmentSerialIgnoreCaseAndStatusIgnoreCase(
            10, "SN-ONLY", "ACTIVE"
        )).thenReturn(Optional.empty());
        when(cashRegisterRepository.findUnboundByStoreAndStatus(10, "ACTIVE")).thenReturn(List.of());
        when(cashRegisterRepository.findMaxRegisterNumberByStoreId(10)).thenReturn(0);
        when(cashRegisterRepository.save(any(CashRegister.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TerminalResolveResult result = resolver.resolve(shop, serial("SN-ONLY"));

        assertThat(result.created()).isTrue();
        assertThat(result.register().getEquipmentSerial()).isEqualTo("SN-ONLY");
        assertThat(result.register().getDeviceId()).isNull();
        verify(cashRegisterRepository, never()).findByDeviceId(any());
    }
}

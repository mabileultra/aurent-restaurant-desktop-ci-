package com.pos.integrations.fiscal.service.impl;

import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.integrations.fiscal.domain.FiscalProvider;
import com.pos.integrations.fiscal.dto.CashierFiscalCapabilitiesResponse;
import com.pos.integrations.fiscaldrive.dto.FiscalDriveSettingsResponse;
import com.pos.integrations.fiscaldrive.service.FiscalDriveSettingsService;
import com.pos.integrations.multikassa.dto.CashierMultikassaCapabilitiesResponse;
import com.pos.integrations.multikassa.service.MultikassaSettingsService;
import com.pos.sales.entity.CashRegister;
import com.pos.sales.repository.CashRegisterRepository;
import com.pos.sales.repository.CashierShiftRepository;
import com.pos.service.support.CashierSaleSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CashierFiscalCapabilitiesServiceImplTest {

    @Mock private CashierSaleSupport cashierSaleSupport;
    @Mock private CashRegisterRepository cashRegisterRepository;
    @Mock private CashierShiftRepository cashierShiftRepository;
    @Mock private MultikassaSettingsService multikassaSettingsService;
    @Mock private FiscalDriveSettingsService fiscalDriveSettingsService;

    @InjectMocks private CashierFiscalCapabilitiesServiceImpl service;

    private final User cashier = new User();
    private final Store store = Store.builder().id(5).name("Shop").build();

    @BeforeEach
    void setUp() {
        when(cashierSaleSupport.requireStoreForSale(any(User.class), eq(5))).thenReturn(store);
    }

    @Test
    void fiscalDriveRegisterUsesFiscalDriveSettingsNotMultikassa() {
        CashRegister register = CashRegister.builder().id(14L).store(store).fiscalProvider(FiscalProvider.FISCAL_DRIVE).build();
        when(cashRegisterRepository.findById(14L)).thenReturn(Optional.of(register));
        when(fiscalDriveSettingsService.getSettings(14L)).thenReturn(new FiscalDriveSettingsResponse(
            14L,
            "http://127.0.0.1:3449",
            "FACTORY-1",
            "ZZ000000000000",
            null,
            "http://127.0.0.1:3449",
            "FISCAL_DRIVE",
            true
        ));

        CashierFiscalCapabilitiesResponse caps = service.getCapabilities(cashier, 5, 14L);

        assertThat(caps.enabled()).isTrue();
        assertThat(caps.fiscalProvider()).isEqualTo("FISCAL_DRIVE");
        assertThat(caps.factoryId()).isEqualTo("FACTORY-1");
        assertThat(caps.requireBeforeSale()).isTrue();
        verify(fiscalDriveSettingsService).getSettings(14L);
    }

    @Test
    void multikassaRegisterStaysOnMultikassa() {
        CashRegister register = CashRegister.builder().id(11L).store(store).fiscalProvider(FiscalProvider.MULTIKASSA).build();
        when(cashRegisterRepository.findById(11L)).thenReturn(Optional.of(register));
        when(multikassaSettingsService.getCashierCapabilities(cashier, 5, 11L))
            .thenReturn(new CashierMultikassaCapabilitiesResponse(
                true, 11L, "http://localhost:8080", "VG1", "M1", null, null, false, true, "MULTIKASSA", null
            ));

        CashierFiscalCapabilitiesResponse caps = service.getCapabilities(cashier, 5, 11L);

        assertThat(caps.enabled()).isTrue();
        assertThat(caps.fiscalProvider()).isEqualTo("MULTIKASSA");
        assertThat(caps.factoryId()).isNull();
        assertThat(caps.moduleNumber()).isEqualTo("M1");
        verify(multikassaSettingsService).getCashierCapabilities(cashier, 5, 11L);
    }
}

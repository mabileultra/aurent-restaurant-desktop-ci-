package com.pos.integrations.fiscal.service.impl;

import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.integrations.fiscal.dto.CashierFiscalCapabilitiesResponse;
import com.pos.integrations.multikassa.dto.CashierMultikassaCapabilitiesResponse;
import com.pos.integrations.multikassa.service.MultikassaSettingsService;
import com.pos.service.support.CashierSaleSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CashierFiscalCapabilitiesServiceImplTest {

    @Mock private CashierSaleSupport cashierSaleSupport;
    @Mock private MultikassaSettingsService multikassaSettingsService;

    @InjectMocks private CashierFiscalCapabilitiesServiceImpl service;

    private final User cashier = new User();
    private final Store store = Store.builder().id(5).name("Shop").build();

    @BeforeEach
    void setUp() {
        when(cashierSaleSupport.requireStoreForSale(any(User.class), eq(5))).thenReturn(store);
    }

    @Test
    void fiscalDriveRegisterStillServesMultikassaWhileDriveIsHidden() {
        when(multikassaSettingsService.getCashierCapabilities(cashier, 5, 14L))
            .thenReturn(new CashierMultikassaCapabilitiesResponse(
                true, 14L, "http://localhost:8080", "VG1", "M1", null, null, false, true, "FISCAL_DRIVE", null
            ));

        CashierFiscalCapabilitiesResponse caps = service.getCapabilities(cashier, 5, 14L);

        assertThat(caps.enabled()).isTrue();
        assertThat(caps.fiscalProvider()).isEqualTo("MULTIKASSA");
        assertThat(caps.factoryId()).isNull();
        assertThat(caps.moduleNumber()).isEqualTo("M1");
        verify(multikassaSettingsService).getCashierCapabilities(cashier, 5, 14L);
    }

    @Test
    void multikassaRegisterStaysOnMultikassa() {
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

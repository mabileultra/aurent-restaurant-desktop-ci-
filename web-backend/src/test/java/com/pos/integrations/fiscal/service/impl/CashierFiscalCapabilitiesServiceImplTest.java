package com.pos.integrations.fiscal.service.impl;

import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.integrations.fiscal.dto.CashierFiscalCapabilitiesResponse;
import com.pos.integrations.fiscaldrive.support.FiscalDriveDefaults;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CashierFiscalCapabilitiesServiceImplTest {

    @Mock private CashierSaleSupport cashierSaleSupport;

    @InjectMocks private CashierFiscalCapabilitiesServiceImpl service;

    private final User cashier = new User();
    private final Store store = Store.builder().id(5).name("Shop").build();

    @BeforeEach
    void setUp() {
        when(cashierSaleSupport.requireStoreForSale(any(User.class), eq(5))).thenReturn(store);
    }

    @Test
    void cashierAlwaysUsesFiscalDrive() {
        CashierFiscalCapabilitiesResponse caps = service.getCapabilities(cashier, 5, 14L);

        assertThat(caps.enabled()).isTrue();
        assertThat(caps.cashRegisterId()).isEqualTo(14L);
        assertThat(caps.fiscalProvider()).isEqualTo("FISCAL_DRIVE");
        assertThat(caps.baseUrl()).isEqualTo(FiscalDriveDefaults.DEFAULT_BASE_URL);
        assertThat(caps.requireBeforeSale()).isTrue();
        assertThat(caps.printFiscalQr()).isTrue();
    }
}

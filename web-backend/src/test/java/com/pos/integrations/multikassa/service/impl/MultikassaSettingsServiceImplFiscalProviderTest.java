package com.pos.integrations.multikassa.service.impl;

import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.integrations.fiscal.domain.FiscalProvider;
import com.pos.integrations.fiscaldrive.entity.CashRegisterFiscalDriveSettings;
import com.pos.integrations.fiscaldrive.repository.CashRegisterFiscalDriveSettingsRepository;
import com.pos.integrations.multikassa.dto.CashierMultikassaCapabilitiesResponse;
import com.pos.integrations.multikassa.entity.CashRegisterMultikassaSettings;
import com.pos.integrations.multikassa.repository.CashRegisterMultikassaSettingsRepository;
import com.pos.integrations.multikassa.support.MultikassaCashierRegisterGuard;
import com.pos.sales.entity.CashRegister;
import com.pos.sales.repository.CashRegisterRepository;
import com.pos.sales.repository.CashierShiftRepository;
import com.pos.service.support.CashierSaleSupport;
import com.pos.service.support.TenantAccessSupport;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MultikassaSettingsServiceImplFiscalProviderTest {

    @Mock private CashRegisterRepository cashRegisterRepository;
    @Mock private CashRegisterMultikassaSettingsRepository settingsRepository;
    @Mock private CashRegisterFiscalDriveSettingsRepository fiscalDriveSettingsRepository;
    @Mock private CashierShiftRepository cashierShiftRepository;
    @Mock private TenantAccessSupport tenantAccess;
    @Mock private CashierSaleSupport cashierSaleSupport;
    @Mock private MultikassaCashierRegisterGuard cashierRegisterGuard;
    @Mock private EntityManager entityManager;

    @InjectMocks private MultikassaSettingsServiceImpl service;

    private final User cashier = new User();
    private final Store store = Store.builder().id(5).name("Shop").build();

    @BeforeEach
    void setUp() {
        when(cashierSaleSupport.requireStoreForSale(any(User.class), eq(5))).thenReturn(store);
    }

    @Test
    void enabledRegisterExposesItsProviderAndKeepsMultikassaFields() {
        CashRegister register = register(11L);
        CashRegisterMultikassaSettings settings = CashRegisterMultikassaSettings.builder()
            .cashRegisterId(11L)
            .cashRegister(register)
            .enabled(true)
            .baseUrl("http://localhost:8080/")
            .terminalId("VG123")
            .requireBeforeSale(true)
            .printFiscalQr(false)
            .build();
        when(cashRegisterRepository.findById(11L)).thenReturn(Optional.of(register));
        when(settingsRepository.findById(11L)).thenReturn(Optional.of(settings));

        CashierMultikassaCapabilitiesResponse caps = service.getCashierCapabilities(cashier, 5, 11L);

        assertThat(caps.enabled()).isTrue();
        assertThat(caps.baseUrl()).isEqualTo("http://localhost:8080");
        assertThat(caps.terminalId()).isEqualTo("VG123");
        assertThat(caps.requireBeforeSale()).isTrue();
        assertThat(caps.printFiscalQr()).isFalse();
        assertThat(caps.fiscalProvider()).isEqualTo(FiscalProvider.MULTIKASSA.name());
        assertThat(caps.factoryId()).isNull();
    }

    @Test
    void fiscalDriveProviderUsesFiscalDriveSettingsEvenIfMultikassaDisabled() {
        CashRegister register = register(14L);
        register.setFiscalProvider(FiscalProvider.FISCAL_DRIVE);
        when(cashRegisterRepository.findById(14L)).thenReturn(Optional.of(register));
        when(fiscalDriveSettingsRepository.findById(14L)).thenReturn(Optional.of(
            CashRegisterFiscalDriveSettings.builder()
                .cashRegisterId(14L)
                .baseUrl("http://127.0.0.1:3449/")
                .factoryId("FACTORY-1")
                .terminalId("ZZ000000000000")
                .build()
        ));
        when(settingsRepository.findById(14L)).thenReturn(Optional.of(
            CashRegisterMultikassaSettings.builder()
                .cashRegisterId(14L)
                .enabled(false)
                .requireBeforeSale(false)
                .printFiscalQr(true)
                .build()
        ));

        CashierMultikassaCapabilitiesResponse caps = service.getCashierCapabilities(cashier, 5, 14L);

        assertThat(caps.enabled()).isTrue();
        assertThat(caps.requireBeforeSale()).isTrue();
        assertThat(caps.fiscalProvider()).isEqualTo(FiscalProvider.FISCAL_DRIVE.name());
        assertThat(caps.factoryId()).isEqualTo("FACTORY-1");
        assertThat(caps.baseUrl()).isEqualTo("http://127.0.0.1:3449");
        assertThat(caps.terminalId()).isEqualTo("ZZ000000000000");
    }

    @Test
    void fiscalDriveWithoutFactoryIdStillEnablesCashierSoPosCanListTheModule() {
        CashRegister register = register(15L);
        register.setFiscalProvider(FiscalProvider.FISCAL_DRIVE);
        when(cashRegisterRepository.findById(15L)).thenReturn(Optional.of(register));
        when(fiscalDriveSettingsRepository.findById(15L)).thenReturn(Optional.of(
            CashRegisterFiscalDriveSettings.builder()
                .cashRegisterId(15L)
                .baseUrl("http://127.0.0.1:3449/")
                .build()
        ));
        when(settingsRepository.findById(15L)).thenReturn(Optional.empty());

        CashierMultikassaCapabilitiesResponse caps = service.getCashierCapabilities(cashier, 5, 15L);

        assertThat(caps.enabled()).isTrue();
        assertThat(caps.requireBeforeSale()).isTrue();
        assertThat(caps.factoryId()).isNull();
        assertThat(caps.fiscalProvider()).isEqualTo(FiscalProvider.FISCAL_DRIVE.name());
    }

    @Test
    void disabledRegisterStillReportsProvider() {
        CashRegister register = register(12L);
        when(cashRegisterRepository.findById(12L)).thenReturn(Optional.of(register));
        when(settingsRepository.findById(12L)).thenReturn(Optional.empty());

        CashierMultikassaCapabilitiesResponse caps = service.getCashierCapabilities(cashier, 5, 12L);

        assertThat(caps.enabled()).isFalse();
        assertThat(caps.cashRegisterId()).isEqualTo(12L);
        assertThat(caps.fiscalProvider()).isEqualTo(FiscalProvider.MULTIKASSA.name());
    }

    @Test
    void legacyRowWithoutProviderDefaultsToMultikassa() {
        CashRegister register = register(13L);
        register.setFiscalProvider(null);
        when(cashRegisterRepository.findById(13L)).thenReturn(Optional.of(register));
        when(settingsRepository.findById(13L)).thenReturn(Optional.empty());

        CashierMultikassaCapabilitiesResponse caps = service.getCashierCapabilities(cashier, 5, 13L);

        assertThat(caps.fiscalProvider()).isEqualTo(FiscalProvider.MULTIKASSA.name());
    }

    @Test
    void noRegisterDefaultsToMultikassa() {
        when(cashierShiftRepository.findByCashierIdAndStoreIdAndStatus(any(), anyInt(), any()))
            .thenReturn(Optional.empty());
        when(cashRegisterRepository.findFirstByStore_IdAndStatusIgnoreCaseOrderByRegisterNumberAsc(anyInt(), eq("ACTIVE")))
            .thenReturn(Optional.empty());

        CashierMultikassaCapabilitiesResponse caps = service.getCashierCapabilities(cashier, 5, null);

        assertThat(caps.enabled()).isFalse();
        assertThat(caps.cashRegisterId()).isNull();
        assertThat(caps.fiscalProvider()).isEqualTo(FiscalProvider.MULTIKASSA.name());
    }

    private CashRegister register(Long id) {
        return CashRegister.builder().id(id).store(store).registerNumber(1).status("ACTIVE").build();
    }
}

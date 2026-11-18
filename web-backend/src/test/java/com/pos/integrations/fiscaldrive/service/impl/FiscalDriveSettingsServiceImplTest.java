package com.pos.integrations.fiscaldrive.service.impl;

import com.pos.entity.Store;
import com.pos.exception.ResourceNotFoundException;
import com.pos.integrations.fiscal.domain.FiscalProvider;
import com.pos.integrations.fiscaldrive.dto.FiscalDriveSettingsResponse;
import com.pos.integrations.fiscaldrive.dto.SaveFiscalDriveSettingsRequest;
import com.pos.integrations.fiscaldrive.entity.CashRegisterFiscalDriveSettings;
import com.pos.integrations.fiscaldrive.repository.CashRegisterFiscalDriveSettingsRepository;
import com.pos.integrations.fiscaldrive.support.FiscalDriveDefaults;
import com.pos.integrations.multikassa.support.MultikassaCashierRegisterGuard;
import com.pos.sales.entity.CashRegister;
import com.pos.sales.repository.CashRegisterRepository;
import com.pos.service.support.TenantAccessSupport;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FiscalDriveSettingsServiceImplTest {

    @Mock private CashRegisterRepository cashRegisterRepository;
    @Mock private CashRegisterFiscalDriveSettingsRepository settingsRepository;
    @Mock private TenantAccessSupport tenantAccess;
    @Mock private MultikassaCashierRegisterGuard registerGuard;

    @InjectMocks private FiscalDriveSettingsServiceImpl service;

    private final Store store = Store.builder().id(5).name("Shop").build();
    private final CashRegister register =
        CashRegister.builder().id(11L).store(store).registerNumber(1).status("ACTIVE").build();

    @Test
    void returnsDefaultsWhenRegisterHasNoSettingsYet() {
        when(cashRegisterRepository.findById(11L)).thenReturn(Optional.of(register));
        when(settingsRepository.findById(11L)).thenReturn(Optional.empty());

        FiscalDriveSettingsResponse res = service.getSettings(11L);

        assertThat(res.cashRegisterId()).isEqualTo(11L);
        assertThat(res.baseUrl()).isEqualTo(FiscalDriveDefaults.DEFAULT_BASE_URL);
        assertThat(res.factoryId()).isNull();
        assertThat(res.defaultBaseUrl()).isEqualTo(FiscalDriveDefaults.DEFAULT_BASE_URL);
        assertThat(res.useForFiscalization()).isFalse();
        verify(tenantAccess).assertCanAccessStore(store);
        verify(registerGuard).assertCashierMayConfigureRegister(any(), any());
    }

    @Test
    void savesNormalizedValuesAndActivatesProvider() {
        when(cashRegisterRepository.findById(11L)).thenReturn(Optional.of(register));
        when(settingsRepository.findById(11L)).thenReturn(Optional.empty());
        when(settingsRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(cashRegisterRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        FiscalDriveSettingsResponse res = service.saveSettings(11L, new SaveFiscalDriveSettingsRequest(
            " http://127.0.0.1:3449/ ",
            " 002024083000152503000000000000000000 ",
            "zz000000000000",
            "  ",
            true
        ));

        ArgumentCaptor<CashRegisterFiscalDriveSettings> saved =
            ArgumentCaptor.forClass(CashRegisterFiscalDriveSettings.class);
        verify(settingsRepository).save(saved.capture());
        assertThat(saved.getValue().getCashRegister()).isSameAs(register);
        assertThat(saved.getValue().getUpdatedAt()).isNotNull();
        assertThat(res.baseUrl()).isEqualTo("http://127.0.0.1:3449");
        assertThat(res.factoryId()).isEqualTo("002024083000152503000000000000000000");
        assertThat(res.terminalId()).isEqualTo("ZZ000000000000");
        assertThat(res.ownerTin()).isNull();
        assertThat(res.useForFiscalization()).isTrue();
        assertThat(register.getFiscalProvider()).isEqualTo(FiscalProvider.FISCAL_DRIVE);
    }

    @Test
    void unknownRegisterIsNotFound() {
        when(cashRegisterRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getSettings(99L)).isInstanceOf(ResourceNotFoundException.class);
    }
}

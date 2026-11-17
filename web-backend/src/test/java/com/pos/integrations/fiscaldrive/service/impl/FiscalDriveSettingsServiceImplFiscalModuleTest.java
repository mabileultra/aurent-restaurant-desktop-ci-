package com.pos.integrations.fiscaldrive.service.impl;

import com.pos.entity.Company;
import com.pos.entity.Store;
import com.pos.exception.ConflictException;
import com.pos.integrations.fiscal.domain.FiscalProvider;
import com.pos.integrations.fiscal.support.FiscalModuleField;
import com.pos.integrations.fiscal.support.InMemoryFiscalModuleOwners;
import com.pos.integrations.fiscaldrive.dto.SaveFiscalDriveSettingsRequest;
import com.pos.integrations.fiscaldrive.entity.CashRegisterFiscalDriveSettings;
import com.pos.integrations.fiscaldrive.repository.CashRegisterFiscalDriveSettingsRepository;
import com.pos.integrations.multikassa.support.MultikassaCashierRegisterGuard;
import com.pos.sales.entity.CashRegister;
import com.pos.sales.repository.CashRegisterRepository;
import com.pos.service.support.TenantAccessSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** AUR-19: factory_id / terminal_id в PUT /admin/cash-registers/{id}/fiscal-drive. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FiscalDriveSettingsServiceImplFiscalModuleTest {

    private static final String BASE_URL = "http://127.0.0.1:3449";

    @Mock private CashRegisterRepository cashRegisterRepository;
    @Mock private CashRegisterFiscalDriveSettingsRepository settingsRepository;
    @Mock private TenantAccessSupport tenantAccess;
    @Mock private MultikassaCashierRegisterGuard registerGuard;

    private final Map<Long, CashRegisterFiscalDriveSettings> rows = new HashMap<>();
    private InMemoryFiscalModuleOwners fm;
    private FiscalDriveSettingsServiceImpl service;
    private CashRegister second;

    @BeforeEach
    void setUp() {
        Store store = Store.builder().id(10).name("Центральный").active(true)
            .company(Company.builder().id(1).build()).build();
        CashRegister first = CashRegister.builder().id(1L).store(store).registerNumber(1).status("ACTIVE").build();
        second = CashRegister.builder().id(2L).store(store).registerNumber(2).status("ACTIVE").build();
        fm = new InMemoryFiscalModuleOwners().register(first).register(second);
        service = new FiscalDriveSettingsServiceImpl(
            cashRegisterRepository, settingsRepository, tenantAccess, registerGuard, fm.guard()
        );

        when(cashRegisterRepository.findById(1L)).thenReturn(Optional.of(first));
        when(cashRegisterRepository.findById(2L)).thenReturn(Optional.of(second));
        when(cashRegisterRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(settingsRepository.findById(any())).thenAnswer(inv -> Optional.ofNullable(rows.get(inv.<Long>getArgument(0))));
        when(settingsRepository.save(any())).thenAnswer(inv -> {
            CashRegisterFiscalDriveSettings row = inv.getArgument(0);
            Long id = row.getCashRegister().getId();
            rows.put(id, row);
            fm.bind(FiscalModuleField.FISCAL_DRIVE_FACTORY_ID, id, row.getFactoryId())
                .bind(FiscalModuleField.FISCAL_DRIVE_TERMINAL_ID, id, row.getTerminalId());
            return row;
        });
    }

    @Test
    void newModuleIsSaved() {
        var res = service.saveSettings(1L, request("0020240830001", "zz000000000001", true));

        assertThat(res.factoryId()).isEqualTo("0020240830001");
        assertThat(res.terminalId()).isEqualTo("ZZ000000000001");
    }

    @Test
    void sameRegisterResavesItsOwnModule() {
        service.saveSettings(1L, request("F-1", "ZZ1", true));

        assertThatCode(() -> service.saveSettings(1L, request(" f-1 ", " zz1 ", true))).doesNotThrowAnyException();
    }

    @Test
    void factoryIdOfAnotherRegisterIsConflictAndNothingChanges() {
        service.saveSettings(1L, request("F-1", null, true));
        service.saveSettings(2L, request("F-2", null, false));
        CashRegisterFiscalDriveSettings loaded = rows.get(2L);

        ConflictException ex = catchThrowableOfType(
            () -> service.saveSettings(2L, request(" f-1 ", null, true)),
            ConflictException.class
        );

        assertThat(ex.getMessage()).isEqualTo("Фискальный модуль «f-1» уже привязан к кассе №1 (Магазин: «Центральный»)");
        assertThat(loaded.getFactoryId()).isEqualTo("F-2");
        assertThat(second.getFiscalProvider()).isEqualTo(FiscalProvider.MULTIKASSA);
        verify(settingsRepository, times(1)).save(loaded);
    }

    @Test
    void terminalIdOfAnotherRegisterIsConflict() {
        service.saveSettings(1L, request("F-1", "ZZ1", true));

        assertThat(catchThrowableOfType(
            () -> service.saveSettings(2L, request("F-2", " zz1", true)),
            ConflictException.class
        )).hasMessageContaining("кассе №1");
    }

    @Test
    void unbindingFreesModuleForAnotherRegister() {
        service.saveSettings(1L, request("F-1", "ZZ1", true));
        service.saveSettings(1L, request("", null, false));

        assertThatCode(() -> service.saveSettings(2L, request("f-1", "zz1", true))).doesNotThrowAnyException();
    }

    private static SaveFiscalDriveSettingsRequest request(String factoryId, String terminalId, Boolean use) {
        return new SaveFiscalDriveSettingsRequest(BASE_URL, factoryId, terminalId, null, use);
    }
}

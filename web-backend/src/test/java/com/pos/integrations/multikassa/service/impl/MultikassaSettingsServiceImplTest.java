package com.pos.integrations.multikassa.service.impl;

import com.pos.entity.Company;
import com.pos.entity.Store;
import com.pos.exception.ConflictException;
import com.pos.integrations.fiscal.support.FiscalModuleField;
import com.pos.integrations.fiscal.support.InMemoryFiscalModuleOwners;
import com.pos.integrations.multikassa.dto.SaveMultikassaSettingsRequest;
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

/** AUR-19: terminal_id / module_number / selected_drive_id в PUT /admin/cash-registers/{id}/multikassa. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MultikassaSettingsServiceImplTest {

    private static final String BASE_URL = "http://127.0.0.1:8080";

    @Mock private CashRegisterRepository cashRegisterRepository;
    @Mock private CashRegisterMultikassaSettingsRepository settingsRepository;
    @Mock private CashierShiftRepository cashierShiftRepository;
    @Mock private TenantAccessSupport tenantAccess;
    @Mock private CashierSaleSupport cashierSaleSupport;
    @Mock private MultikassaCashierRegisterGuard cashierRegisterGuard;
    @Mock private EntityManager entityManager;

    private final Map<Long, CashRegisterMultikassaSettings> rows = new HashMap<>();
    private InMemoryFiscalModuleOwners fm;
    private MultikassaSettingsServiceImpl service;

    @BeforeEach
    void setUp() {
        Store store = Store.builder().id(10).name("Центральный").active(true)
            .company(Company.builder().id(1).build()).build();
        CashRegister first = CashRegister.builder().id(1L).store(store).registerNumber(1).status("ACTIVE").build();
        CashRegister second = CashRegister.builder().id(2L).store(store).registerNumber(2).status("ACTIVE").build();
        fm = new InMemoryFiscalModuleOwners().register(first).register(second);
        service = new MultikassaSettingsServiceImpl(
            cashRegisterRepository, settingsRepository, cashierShiftRepository, tenantAccess,
            cashierSaleSupport, cashierRegisterGuard, entityManager, fm.guard()
        );

        when(cashRegisterRepository.findById(1L)).thenReturn(Optional.of(first));
        when(cashRegisterRepository.findById(2L)).thenReturn(Optional.of(second));
        when(settingsRepository.findById(any())).thenAnswer(inv -> Optional.ofNullable(rows.get(inv.<Long>getArgument(0))));
        when(settingsRepository.save(any())).thenAnswer(inv -> {
            CashRegisterMultikassaSettings row = inv.getArgument(0);
            Long id = row.getCashRegister().getId();
            rows.put(id, row);
            fm.bind(FiscalModuleField.MULTIKASSA_TERMINAL_ID, id, row.getTerminalId())
                .bind(FiscalModuleField.MULTIKASSA_MODULE_NUMBER, id, row.getModuleNumber())
                .bind(FiscalModuleField.MULTIKASSA_SELECTED_DRIVE_ID, id, row.getSelectedDriveId());
            return row;
        });
    }

    @Test
    void newModuleIsSaved() {
        var res = service.saveAdminSettings(1L, request(true, " YZ1 ", "YZ1", "D-1"));

        assertThat(res.terminalId()).isEqualTo("YZ1");
        assertThat(rows.get(1L).getModuleNumber()).isEqualTo("YZ1");
    }

    @Test
    void sameRegisterResavesItsOwnModule() {
        service.saveAdminSettings(1L, request(true, "YZ1", "YZ1", "D-1"));

        assertThatCode(() -> service.saveAdminSettings(1L, request(true, " yz1", "yz1 ", " d-1 ")))
            .doesNotThrowAnyException();
    }

    @Test
    void terminalIdOfAnotherRegisterIsConflictAndLoadedRowStaysUntouched() {
        service.saveAdminSettings(1L, request(true, "YZ1", null, null));
        service.saveAdminSettings(2L, request(false, "OLD-2", null, null));
        CashRegisterMultikassaSettings loaded = rows.get(2L);

        ConflictException ex = catchThrowableOfType(
            () -> service.saveAdminSettings(2L, request(true, " yz1 ", null, null)),
            ConflictException.class
        );

        assertThat(ex.getMessage()).isEqualTo("Фискальный модуль «yz1» уже привязан к кассе №1 (Магазин: «Центральный»)");
        assertThat(loaded.getTerminalId()).isEqualTo("OLD-2");
        assertThat(loaded.isEnabled()).isFalse();
        verify(settingsRepository, times(1)).save(loaded); // только первичное сохранение кассы №2
    }

    @Test
    void terminalIdMatchingModuleNumberOfAnotherRegisterIsConflict() {
        service.saveAdminSettings(1L, request(true, null, "YZ777", null));

        ConflictException ex = catchThrowableOfType(
            () -> service.saveAdminSettings(2L, request(true, "yz777", null, null)),
            ConflictException.class
        );

        assertThat(ex.context()).containsEntry("conflictField", "MULTIKASSA_MODULE_NUMBER");
    }

    @Test
    void moduleNumberMatchingTerminalIdOfAnotherRegisterIsConflict() {
        service.saveAdminSettings(1L, request(true, "YZ777", null, null));

        ConflictException ex = catchThrowableOfType(
            () -> service.saveAdminSettings(2L, request(true, null, " YZ777 ", null)),
            ConflictException.class
        );

        assertThat(ex.context()).containsEntry("conflictField", "MULTIKASSA_TERMINAL_ID");
    }

    @Test
    void selectedDriveIdOfAnotherRegisterIsConflict() {
        service.saveAdminSettings(1L, request(true, null, null, "DRIVE-9"));

        assertThat(catchThrowableOfType(
            () -> service.saveAdminSettings(2L, request(true, null, null, "drive-9")),
            ConflictException.class
        )).hasMessageContaining("кассе №1");
    }

    @Test
    void filledFieldsAreCheckedEvenWhenMultikassaIsDisabled() {
        service.saveAdminSettings(1L, request(true, "YZ1", null, null));

        assertThat(catchThrowableOfType(
            () -> service.saveAdminSettings(2L, request(false, "YZ1", null, null)),
            ConflictException.class
        )).isNotNull();
    }

    @Test
    void unbindingWithNullOrEmptyFreesModuleForAnotherRegister() {
        service.saveAdminSettings(1L, request(true, "YZ1", "YZ1", "D-1"));
        service.saveAdminSettings(1L, request(true, null, "", "  "));

        assertThatCode(() -> service.saveAdminSettings(2L, request(true, "yz1", "YZ1", "d-1")))
            .doesNotThrowAnyException();
    }

    private static SaveMultikassaSettingsRequest request(
        boolean enabled,
        String terminalId,
        String moduleNumber,
        String selectedDriveId
    ) {
        return new SaveMultikassaSettingsRequest(
            enabled, BASE_URL, terminalId, moduleNumber, selectedDriveId, null, false, true
        );
    }
}

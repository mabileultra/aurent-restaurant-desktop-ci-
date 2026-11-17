package com.pos.integrations.fiscal.support;

import com.pos.entity.Company;
import com.pos.entity.Store;
import com.pos.exception.ConflictException;
import com.pos.sales.entity.CashRegister;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;

import java.util.Collection;
import java.util.EnumMap;
import java.util.Map;

import static com.pos.integrations.fiscal.support.FiscalModuleField.CASH_REGISTER_FISCAL_CARD_ID;
import static com.pos.integrations.fiscal.support.FiscalModuleField.FISCAL_DRIVE_FACTORY_ID;
import static com.pos.integrations.fiscal.support.FiscalModuleField.MULTIKASSA_MODULE_NUMBER;
import static com.pos.integrations.fiscal.support.FiscalModuleField.MULTIKASSA_SELECTED_DRIVE_ID;
import static com.pos.integrations.fiscal.support.FiscalModuleField.MULTIKASSA_TERMINAL_ID;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

class FiscalModuleBindingGuardTest {

    private static final int OWN_COMPANY = 1;
    private static final int FOREIGN_COMPANY = 2;

    private InMemoryFiscalModuleOwners state;
    private FiscalModuleBindingGuard guard;

    @BeforeEach
    void setUp() {
        state = new InMemoryFiscalModuleOwners()
            .register(register(1L, 1, "Ташкент-1", OWN_COMPANY))
            .register(register(2L, 2, "Центральный", OWN_COMPANY))
            .register(register(3L, 7, "Чужой магазин", FOREIGN_COMPANY));
        guard = state.guard();
    }

    @Test
    void normalizeKeyIgnoresCaseAndOuterSpaces() {
        assertThat(FiscalModuleBindingGuard.normalizeKey(" yz123 ")).isEqualTo("yz123");
        assertThat(FiscalModuleBindingGuard.normalizeKey("YZ123")).isEqualTo("yz123");
        assertThat(FiscalModuleBindingGuard.normalizeKey("   ")).isNull();
        assertThat(FiscalModuleBindingGuard.normalizeKey(null)).isNull();
    }

    @Test
    void blankValuesAreUnbindingAndSkipLocksAndQueries() {
        Map<FiscalModuleField, String> values = new EnumMap<>(FiscalModuleField.class);
        values.put(MULTIKASSA_TERMINAL_ID, null);
        values.put(MULTIKASSA_MODULE_NUMBER, "");
        values.put(MULTIKASSA_SELECTED_DRIVE_ID, "   ");

        guard.assertAvailable(values, 1L, OWN_COMPANY);

        verifyNoInteractions(state.lock(), state.repository());
    }

    @Test
    void sameCompanyConflictNamesRegisterAndStoreInMessageAndContext() {
        state.bind(CASH_REGISTER_FISCAL_CARD_ID, 2L, "YZ231006044579");

        ConflictException ex = catchThrowableOfType(
            () -> guard.assertAvailable(CASH_REGISTER_FISCAL_CARD_ID, " yz231006044579 ", 1L, OWN_COMPANY),
            ConflictException.class
        );

        assertThat(ex.getMessage())
            .isEqualTo("Фискальный модуль «yz231006044579» уже привязан к кассе №2 (Магазин: «Центральный»)");
        assertThat(ex.context())
            .containsEntry("field", "CASH_REGISTER_FISCAL_CARD_ID")
            .containsEntry("conflictField", "CASH_REGISTER_FISCAL_CARD_ID")
            .containsEntry("conflictRegisterId", 2L)
            .containsEntry("conflictRegisterNumber", 2)
            .containsEntry("conflictStoreId", 20)
            .containsEntry("conflictStoreName", "Центральный")
            .containsEntry("conflictRegisterStatus", "ACTIVE");
    }

    @Test
    void foreignCompanyConflictHidesOwnerInMessageAndContext() {
        state.bind(CASH_REGISTER_FISCAL_CARD_ID, 3L, "YZ999");

        ConflictException ex = catchThrowableOfType(
            () -> guard.assertAvailable(CASH_REGISTER_FISCAL_CARD_ID, "yz999", 1L, OWN_COMPANY),
            ConflictException.class
        );

        assertThat(ex.getMessage()).isEqualTo("Фискальный модуль «yz999» уже привязан к кассе другой компании");
        assertThat(ex.getMessage()).doesNotContain("№").doesNotContain("Чужой магазин");
        assertThat(ex.context()).containsOnlyKeys("field", "conflictField", "conflictScope");
        assertThat(ex.context()).containsEntry("conflictScope", "OTHER_COMPANY");
        assertThat(ex.context().values()).doesNotContain(3L, 7, 30, "Чужой магазин");
    }

    @Test
    void unknownCurrentCompanyIsTreatedAsForeign() {
        state.bind(CASH_REGISTER_FISCAL_CARD_ID, 2L, "YZ1");

        assertThatThrownBy(() -> guard.assertAvailable(CASH_REGISTER_FISCAL_CARD_ID, "YZ1", 1L, null))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("кассе другой компании");
    }

    @Test
    void sameRegisterWithItsOwnValuePasses() {
        state.bind(CASH_REGISTER_FISCAL_CARD_ID, 1L, "YZ1");

        assertThatCode(() -> guard.assertAvailable(CASH_REGISTER_FISCAL_CARD_ID, " yz1 ", 1L, OWN_COMPANY))
            .doesNotThrowAnyException();
    }

    @Test
    void newRegisterPassesNullExcludeIdAndStillSeesOccupiedValue() {
        state.bind(CASH_REGISTER_FISCAL_CARD_ID, 1L, "YZ1");

        assertThatThrownBy(() -> guard.assertAvailable(CASH_REGISTER_FISCAL_CARD_ID, "YZ1", null, OWN_COMPANY))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("кассе №1");
        verify(state.repository()).findByFiscalCardId("yz1", null);
    }

    @Test
    void multikassaTerminalIdConflictsWithModuleNumberOfAnotherRegister() {
        state.bind(MULTIKASSA_MODULE_NUMBER, 2L, "YZ777");

        ConflictException ex = catchThrowableOfType(
            () -> guard.assertAvailable(MULTIKASSA_TERMINAL_ID, "yz777", 1L, OWN_COMPANY),
            ConflictException.class
        );

        assertThat(ex.context())
            .containsEntry("field", "MULTIKASSA_TERMINAL_ID")
            .containsEntry("conflictField", "MULTIKASSA_MODULE_NUMBER");
        assertThat(ex.getMessage()).contains("кассе №2");
    }

    @Test
    void multikassaModuleNumberConflictsWithTerminalIdOfAnotherRegister() {
        state.bind(MULTIKASSA_TERMINAL_ID, 2L, "YZ777");

        ConflictException ex = catchThrowableOfType(
            () -> guard.assertAvailable(MULTIKASSA_MODULE_NUMBER, " YZ777", 1L, OWN_COMPANY),
            ConflictException.class
        );

        assertThat(ex.context())
            .containsEntry("field", "MULTIKASSA_MODULE_NUMBER")
            .containsEntry("conflictField", "MULTIKASSA_TERMINAL_ID");
    }

    @Test
    void sameSerialInTerminalIdAndModuleNumberOfOneRegisterIsAllowed() {
        state.bind(MULTIKASSA_TERMINAL_ID, 1L, "YZ5").bind(MULTIKASSA_MODULE_NUMBER, 1L, "YZ5");
        Map<FiscalModuleField, String> values = new EnumMap<>(FiscalModuleField.class);
        values.put(MULTIKASSA_TERMINAL_ID, "YZ5");
        values.put(MULTIKASSA_MODULE_NUMBER, "yz5");

        assertThatCode(() -> guard.assertAvailable(values, 1L, OWN_COMPANY)).doesNotThrowAnyException();
    }

    @Test
    void groupsDoNotCrossOutsideMultikassaSerial() {
        state.bind(MULTIKASSA_SELECTED_DRIVE_ID, 2L, "X1").bind(CASH_REGISTER_FISCAL_CARD_ID, 2L, "X1");

        assertThatCode(() -> guard.assertAvailable(MULTIKASSA_TERMINAL_ID, "X1", 1L, OWN_COMPANY))
            .doesNotThrowAnyException();
        assertThatCode(() -> guard.assertAvailable(FISCAL_DRIVE_FACTORY_ID, "X1", 1L, OWN_COMPANY))
            .doesNotThrowAnyException();
    }

    @Test
    void inactiveRegisterStillOwnsItsModule() {
        CashRegister inactive = register(4L, 4, "Склад", OWN_COMPANY);
        inactive.setStatus("INACTIVE");
        state.register(inactive).bind(CASH_REGISTER_FISCAL_CARD_ID, 4L, "YZ4");

        assertThatThrownBy(() -> guard.assertAvailable(CASH_REGISTER_FISCAL_CARD_ID, "YZ4", 1L, OWN_COMPANY))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("кассе №4");
    }

    @Test
    @SuppressWarnings("unchecked")
    void locksGroupKeysBeforeLookingUpOwners() {
        Map<FiscalModuleField, String> values = new EnumMap<>(FiscalModuleField.class);
        values.put(MULTIKASSA_TERMINAL_ID, " YZ1 ");
        values.put(MULTIKASSA_MODULE_NUMBER, "yz2");
        values.put(MULTIKASSA_SELECTED_DRIVE_ID, "D-1");

        guard.assertAvailable(values, 1L, OWN_COMPANY);

        ArgumentCaptor<Collection<String>> keys = ArgumentCaptor.forClass(Collection.class);
        InOrder order = inOrder(state.lock(), state.repository());
        order.verify(state.lock()).lockAll(keys.capture());
        order.verify(state.repository()).findByMultikassaTerminalId(anyString(), any());
        assertThat(keys.getValue()).containsExactlyInAnyOrder(
            "MULTIKASSA_FM_SERIAL:yz1",
            "MULTIKASSA_FM_SERIAL:yz2",
            "MULTIKASSA_DRIVE:d-1"
        );
    }

    private static CashRegister register(Long id, int number, String storeName, int companyId) {
        Store store = Store.builder()
            .id(id.intValue() * 10)
            .name(storeName)
            .active(true)
            .company(Company.builder().id(companyId).build())
            .build();
        return CashRegister.builder().id(id).registerNumber(number).store(store).status("ACTIVE").build();
    }
}

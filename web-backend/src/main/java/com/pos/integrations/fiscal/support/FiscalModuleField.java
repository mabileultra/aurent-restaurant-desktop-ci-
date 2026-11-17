package com.pos.integrations.fiscal.support;

import java.util.Arrays;
import java.util.List;

/**
 * Колонки, в которых хранится идентификатор фискального модуля, и их группы уникальности (AUR-19).
 */
public enum FiscalModuleField {
    CASH_REGISTER_FISCAL_CARD_ID("cash_registers.fiscal_card_id", FiscalModuleGroup.CASH_REGISTER_FISCAL_CARD),
    MULTIKASSA_TERMINAL_ID("cash_register_multikassa_settings.terminal_id", FiscalModuleGroup.MULTIKASSA_FM_SERIAL),
    MULTIKASSA_MODULE_NUMBER("cash_register_multikassa_settings.module_number", FiscalModuleGroup.MULTIKASSA_FM_SERIAL),
    MULTIKASSA_SELECTED_DRIVE_ID("cash_register_multikassa_settings.selected_drive_id", FiscalModuleGroup.MULTIKASSA_DRIVE),
    FISCAL_DRIVE_FACTORY_ID("cash_register_fiscal_drive_settings.factory_id", FiscalModuleGroup.FISCAL_DRIVE_FACTORY),
    FISCAL_DRIVE_TERMINAL_ID("cash_register_fiscal_drive_settings.terminal_id", FiscalModuleGroup.FISCAL_DRIVE_TERMINAL);

    private final String column;
    private final FiscalModuleGroup group;

    FiscalModuleField(String column, FiscalModuleGroup group) {
        this.column = column;
        this.group = group;
    }

    public String column() {
        return column;
    }

    public FiscalModuleGroup group() {
        return group;
    }

    /** Все колонки, где значение этого поля у другой кассы считается конфликтом. */
    public List<FiscalModuleField> searchScope() {
        return Arrays.stream(values()).filter(f -> f.group == group).toList();
    }
}

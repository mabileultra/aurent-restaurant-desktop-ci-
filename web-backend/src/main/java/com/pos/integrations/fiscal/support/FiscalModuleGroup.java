package com.pos.integrations.fiscal.support;

/**
 * Пространство значений, внутри которого идентификатор ФМ должен принадлежать одной кассе (AUR-19).
 * Поля одной группы сверяются друг с другом: так Multikassa {@code terminal_id} и {@code module_number}
 * проверяются перекрёстно. Группы между собой не пересекаются.
 */
public enum FiscalModuleGroup {
    CASH_REGISTER_FISCAL_CARD,
    MULTIKASSA_FM_SERIAL,
    MULTIKASSA_DRIVE,
    FISCAL_DRIVE_FACTORY,
    FISCAL_DRIVE_TERMINAL;

    /** Ключ advisory-lock: одна группа + нормализованное значение. */
    public String lockKey(String normalizedValue) {
        return name() + ':' + normalizedValue;
    }
}

package com.pos.integrations.fiscal.support;

import com.pos.exception.ConflictException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

/**
 * Формирует 409 для занятого ФМ (AUR-19). Данные кассы чужой компании не попадают
 * ни в {@code message}, ни в {@code context}: при {@code app.errors.include-context=true}
 * context уходит в HTTP-ответ.
 */
final class FiscalModuleConflicts {

    static final String SCOPE_OTHER_COMPANY = "OTHER_COMPANY";

    private FiscalModuleConflicts() {
    }

    static ConflictException conflict(
        FiscalModuleField field,
        FiscalModuleField conflictField,
        String displayValue,
        FiscalModuleOwner owner,
        Integer currentCompanyId
    ) {
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("field", field.name());
        context.put("conflictField", conflictField.name());
        if (!isSameCompany(owner, currentCompanyId)) {
            context.put("conflictScope", SCOPE_OTHER_COMPANY);
            return new ConflictException(
                "Фискальный модуль «" + displayValue + "» уже привязан к кассе другой компании",
                context
            );
        }
        context.put("conflictRegisterId", owner.registerId());
        context.put("conflictRegisterNumber", owner.registerNumber());
        context.put("conflictStoreId", owner.storeId());
        context.put("conflictStoreName", owner.storeName());
        context.put("conflictRegisterStatus", owner.status());
        return new ConflictException(
            "Фискальный модуль «" + displayValue + "» уже привязан к кассе №" + owner.registerNumber()
                + " (Магазин: «" + Objects.toString(owner.storeName(), "—") + "»)",
            context
        );
    }

    private static boolean isSameCompany(FiscalModuleOwner owner, Integer currentCompanyId) {
        return currentCompanyId != null && currentCompanyId.equals(owner.companyId());
    }
}

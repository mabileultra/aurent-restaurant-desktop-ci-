package com.pos.integrations.fiscal.support;

import com.pos.integrations.fiscal.repository.FiscalModuleOwnerRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Запрещает привязку одного фискального модуля к нескольким кассам (AUR-19).
 *
 * <p>Вызывать внутри write-транзакции и <b>до</b> изменения JPA-сущностей: запросы guard
 * могут вызвать auto-flush managed-сущности. Пустое значение (отвязка) не проверяется.
 * Касса в статусе INACTIVE тоже считается владельцем — ФМ освобождается только явной отвязкой.
 */
@Component
@RequiredArgsConstructor
public class FiscalModuleBindingGuard {

    private final FiscalModuleOwnerRepository ownerRepository;
    private final FiscalModuleLock lock;

    /** {@code " yz123 "} и {@code "YZ123"} — один модуль; пустое значение → {@code null}. */
    public static String normalizeKey(String raw) {
        return StringUtils.hasText(raw) ? raw.trim().toLowerCase(Locale.ROOT) : null;
    }

    public void assertAvailable(
        FiscalModuleField field,
        String rawValue,
        Long currentRegisterId,
        Integer currentCompanyId
    ) {
        Map<FiscalModuleField, String> values = new EnumMap<>(FiscalModuleField.class);
        values.put(field, rawValue);
        assertAvailable(values, currentRegisterId, currentCompanyId);
    }

    /**
     * @param currentRegisterId касса, которую сохраняем; {@code null} — создаётся новая касса
     * @param currentCompanyId  компания сохраняемой кассы — от неё зависит, раскрывать ли данные владельца
     */
    public void assertAvailable(
        Map<FiscalModuleField, String> rawValues,
        Long currentRegisterId,
        Integer currentCompanyId
    ) {
        Map<FiscalModuleField, String> keys = new EnumMap<>(FiscalModuleField.class);
        rawValues.forEach((field, raw) -> {
            String key = normalizeKey(raw);
            if (key != null) {
                keys.put(field, key);
            }
        });
        if (keys.isEmpty()) {
            return;
        }
        lock.lockAll(keys.entrySet().stream().map(e -> e.getKey().group().lockKey(e.getValue())).toList());

        for (Map.Entry<FiscalModuleField, String> entry : keys.entrySet()) {
            FiscalModuleField field = entry.getKey();
            for (FiscalModuleField scopeField : field.searchScope()) {
                List<FiscalModuleOwner> owners = findOwners(scopeField, entry.getValue(), currentRegisterId);
                if (!owners.isEmpty()) {
                    FiscalModuleOwner owner = owners.get(0);
                    LogUtil.warn(
                        FiscalModuleBindingGuard.class,
                        "Fiscal module already bound: field={}, conflictField={}, registerId={}, ownerRegisterId={}",
                        field,
                        scopeField,
                        currentRegisterId,
                        owner.registerId()
                    );
                    throw FiscalModuleConflicts.conflict(
                        field, scopeField, rawValues.get(field).trim(), owner, currentCompanyId
                    );
                }
            }
        }
    }

    private List<FiscalModuleOwner> findOwners(FiscalModuleField field, String key, Long excludeId) {
        return switch (field) {
            case CASH_REGISTER_FISCAL_CARD_ID -> ownerRepository.findByFiscalCardId(key, excludeId);
            case MULTIKASSA_TERMINAL_ID -> ownerRepository.findByMultikassaTerminalId(key, excludeId);
            case MULTIKASSA_MODULE_NUMBER -> ownerRepository.findByMultikassaModuleNumber(key, excludeId);
            case MULTIKASSA_SELECTED_DRIVE_ID -> ownerRepository.findByMultikassaSelectedDriveId(key, excludeId);
            case FISCAL_DRIVE_FACTORY_ID -> ownerRepository.findByFiscalDriveFactoryId(key, excludeId);
            case FISCAL_DRIVE_TERMINAL_ID -> ownerRepository.findByFiscalDriveTerminalId(key, excludeId);
        };
    }
}

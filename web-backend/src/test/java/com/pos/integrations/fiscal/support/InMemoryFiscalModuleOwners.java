package com.pos.integrations.fiscal.support;

import com.pos.integrations.fiscal.repository.FiscalModuleOwnerRepository;
import com.pos.sales.entity.CashRegister;
import org.mockito.Answers;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import static org.mockito.Mockito.mock;

/**
 * Тестовое in-memory состояние привязок ФМ: репозиторий-заглушка повторяет семантику JPQL
 * ({@code LOWER(TRIM(col)) = :key AND (:excludeId IS NULL OR id <> :excludeId)}), а сервисные
 * тесты обновляют его из {@code save(...)}, чтобы сценарий «отвязали → привязали к другой» был честным.
 * Сам SQL проверяется на PostgreSQL в {@code com.pos.integrations.fiscal.FiscalModulePostgresTest}.
 */
public final class InMemoryFiscalModuleOwners {

    private final Map<FiscalModuleField, Map<Long, String>> bindings = new EnumMap<>(FiscalModuleField.class);
    private final Map<Long, FiscalModuleOwner> owners = new HashMap<>();
    private final List<String> queries = new ArrayList<>();

    private final FiscalModuleOwnerRepository repository =
        mock(FiscalModuleOwnerRepository.class, invocation -> invocation.getMethod().getName().startsWith("findBy")
            ? find(fieldOf(invocation.getMethod().getName()), invocation.getArgument(0), invocation.getArgument(1))
            : Answers.RETURNS_DEFAULTS.answer(invocation));
    private final FiscalModuleLock lock = mock(FiscalModuleLock.class);

    public FiscalModuleBindingGuard guard() {
        return new FiscalModuleBindingGuard(repository, lock);
    }

    public FiscalModuleOwnerRepository repository() {
        return repository;
    }

    public FiscalModuleLock lock() {
        return lock;
    }

    /** Журнал вызовов поиска: {@code field|key|excludeId}. */
    public List<String> queries() {
        return queries;
    }

    public InMemoryFiscalModuleOwners register(CashRegister register) {
        Integer storeId = register.getStore() != null ? register.getStore().getId() : null;
        String storeName = register.getStore() != null ? register.getStore().getName() : null;
        Integer companyId = register.getStore() != null && register.getStore().getCompany() != null
            ? register.getStore().getCompany().getId()
            : null;
        owners.put(register.getId(), new FiscalModuleOwner(
            register.getId(), register.getRegisterNumber(), storeId, storeName, companyId, register.getStatus()
        ));
        return this;
    }

    /** Пустое значение = отвязка (как в БД после trimToNull). */
    public InMemoryFiscalModuleOwners bind(FiscalModuleField field, Long registerId, String rawValue) {
        Map<Long, String> column = bindings.computeIfAbsent(field, f -> new LinkedHashMap<>());
        if (StringUtils.hasText(rawValue)) {
            column.put(registerId, rawValue);
        } else {
            column.remove(registerId);
        }
        return this;
    }

    private List<FiscalModuleOwner> find(FiscalModuleField field, String key, Long excludeId) {
        queries.add(field + "|" + key + "|" + excludeId);
        return bindings.getOrDefault(field, Map.of()).entrySet().stream()
            .filter(e -> Objects.equals(FiscalModuleBindingGuard.normalizeKey(e.getValue()), key))
            .filter(e -> excludeId == null || !excludeId.equals(e.getKey()))
            .map(e -> owners.get(e.getKey()))
            .toList();
    }

    private static FiscalModuleField fieldOf(String method) {
        return switch (method) {
            case "findByFiscalCardId" -> FiscalModuleField.CASH_REGISTER_FISCAL_CARD_ID;
            case "findByMultikassaTerminalId" -> FiscalModuleField.MULTIKASSA_TERMINAL_ID;
            case "findByMultikassaModuleNumber" -> FiscalModuleField.MULTIKASSA_MODULE_NUMBER;
            case "findByMultikassaSelectedDriveId" -> FiscalModuleField.MULTIKASSA_SELECTED_DRIVE_ID;
            case "findByFiscalDriveFactoryId" -> FiscalModuleField.FISCAL_DRIVE_FACTORY_ID;
            case "findByFiscalDriveTerminalId" -> FiscalModuleField.FISCAL_DRIVE_TERMINAL_ID;
            default -> throw new IllegalStateException("Unexpected repository call: " + method);
        };
    }
}

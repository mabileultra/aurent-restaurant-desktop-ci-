package com.pos.integrations.fiscal.support;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.TreeSet;

/**
 * Транзакционный advisory-lock PostgreSQL на идентификатор ФМ (AUR-19).
 * Сериализует параллельные привязки одного значения, в том числе перекрёстные
 * (Multikassa {@code terminal_id} одной кассы ↔ {@code module_number} другой): второй запрос ждёт
 * коммита первого и затем видит его запись. Lock снимается в конце транзакции вызывающего сервиса.
 */
@Component
@RequiredArgsConstructor
public class FiscalModuleLock {

    /** classid в {@code pg_advisory_xact_lock(int, int)}: отделяет ключи AUR-19 от прочих advisory-lock'ов. */
    static final int LOCK_NAMESPACE = 1919;

    private static final String LOCK_SQL = "SELECT 1 FROM pg_advisory_xact_lock(:ns, hashtext(:key))";

    private final EntityManager entityManager;

    /** Берёт lock'и в отсортированном порядке, чтобы два запроса с несколькими полями не встали в дедлок. */
    public void lockAll(Collection<String> keys) {
        for (String key : new TreeSet<>(keys)) {
            entityManager.createNativeQuery(LOCK_SQL)
                .setParameter("ns", LOCK_NAMESPACE)
                .setParameter("key", key)
                .getSingleResult();
        }
    }
}

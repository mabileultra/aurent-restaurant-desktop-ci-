package com.pos.client.catalog;

import com.pos.config.catalog.CatalogServiceProperties;
import com.pos.exception.PosExceptions;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Shared DUAL (after-commit best-effort) vs strict (sync, fail-fast) scheduling.
 * Strict = {@code REMOTE_ONLY} mirror or {@code CATALOG_PRIMARY} (category outbound path).
 */
@Component
@RequiredArgsConstructor
public class CatalogRemoteWriteSupport {

    private final CatalogServiceProperties properties;

    public void run(Runnable action) {
        if (properties.strictRemoteWrite()) {
            action.run();
            return;
        }
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
    }

    public void requireOk(boolean ok, String message) {
        if (!ok && properties.strictRemoteWrite()) {
            throw PosExceptions.badRequest(
                message,
                "catalog.write-mode",
                properties.effectiveWriteMode().name()
            );
        }
    }
}

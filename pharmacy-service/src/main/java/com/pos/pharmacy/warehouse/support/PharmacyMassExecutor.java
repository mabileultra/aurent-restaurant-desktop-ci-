package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.config.PharmacyAsyncProperties;
import com.pos.pharmacy.config.PharmacyExecutorNames;
import com.pos.shared.log.LogUtil;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.concurrent.Executor;

/**
 * Фасад над {@link PharmacyExecutorNames#IMPORT} для массового импорта и проведения.
 * Размер пула — из {@code app.pharmacy.async.import-pool}.
 */
@Component
public class PharmacyMassExecutor {

    private final Executor executor;
    private final int threadCount;

    public PharmacyMassExecutor(
        @Qualifier(PharmacyExecutorNames.IMPORT) Executor executor,
        PharmacyAsyncProperties properties
    ) {
        this.executor = executor;
        this.threadCount = Math.max(1, properties.getImportPool().getMaxPoolSize());
        LogUtil.info(PharmacyMassExecutor.class, "Mass import/activate uses import pool threads={}", threadCount);
    }

    public Executor executor() {
        return executor;
    }

    public int threadCount() {
        return threadCount;
    }
}

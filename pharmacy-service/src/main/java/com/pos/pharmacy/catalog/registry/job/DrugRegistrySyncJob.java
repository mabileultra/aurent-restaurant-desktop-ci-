package com.pos.pharmacy.catalog.registry.job;

import com.pos.pharmacy.catalog.registry.service.DrugRegistryImportService;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.pharmacy.drug-registry.enabled", havingValue = "true", matchIfMissing = true)
public class DrugRegistrySyncJob {

    private final DrugRegistryImportService importService;

    @Value("${app.pharmacy.drug-registry.enabled:true}")
    private boolean enabled;

    @Scheduled(cron = "${app.pharmacy.drug-registry.cron:0 0 4 */3 * *}")
    public void sync() {
        if (!enabled) {
            return;
        }
        try {
            var result = importService.sync();
            LogUtil.info(
                DrugRegistrySyncJob.class,
                "Drug registry sync skipped={} rows={} filled={}",
                result.skipped(),
                result.rowCount(),
                result.filledProducts()
            );
        } catch (Exception e) {
            LogUtil.error(DrugRegistrySyncJob.class, "Drug registry sync failed: {}", e.toString());
        }
    }
}

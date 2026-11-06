package com.pos.pharmacy.pricing.registry.job;

import com.pos.pharmacy.pricing.registry.service.PharmacyPriceRegistryService;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.pharmacy.price-registry.enabled", havingValue = "true", matchIfMissing = true)
public class PharmacyPriceRegistrySyncJob {

    private final PharmacyPriceRegistryService priceRegistryService;

    @Value("${app.pharmacy.price-registry.enabled:true}")
    private boolean enabled;

    @Scheduled(cron = "${app.pharmacy.price-registry.cron:0 0 3 * * *}")
    public void nightlySync() {
        if (!enabled) {
            return;
        }
        try {
            var result = priceRegistryService.syncAllCompanies();
            LogUtil.info(
                PharmacyPriceRegistrySyncJob.class,
                "Nightly price registry sync done snapshot={} pending={} applied={}",
                result.snapshotId(),
                result.pendingOverLimit(),
                result.applied()
            );
        } catch (Exception e) {
            LogUtil.error(
                PharmacyPriceRegistrySyncJob.class,
                "Nightly price registry sync failed: {}",
                e.toString()
            );
        }
    }
}

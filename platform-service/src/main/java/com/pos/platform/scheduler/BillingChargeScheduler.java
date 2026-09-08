package com.pos.platform.scheduler;

import com.pos.platform.service.BillingService;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BillingChargeScheduler {

    private final BillingService billingService;

    @Scheduled(cron = "${app.billing.charge-cron:0 0 3 * * *}")
    public void chargeDueSubscriptions() {
        int charged = billingService.runDueCharges();
        if (charged > 0) {
            LogUtil.info(BillingChargeScheduler.class, "Billing charges applied: " + charged);
        }
    }
}

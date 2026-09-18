package com.pos.pharmacy.revenue.service.impl;

import com.pos.pharmacy.config.PharmacyExecutorNames;
import com.pos.pharmacy.revenue.service.RevenueOutboxService;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RevenueOutboxAsyncSender {

    private final RevenueOutboxService outboxService;

    @Async(PharmacyExecutorNames.REVENUE_OUTBOX)
    public void send(UUID outboxId) {
        try {
            outboxService.trySend(outboxId);
        } catch (Exception ex) {
            LogUtil.warn(
                RevenueOutboxAsyncSender.class,
                "Async revenue outbox send failed id={}: {}",
                outboxId,
                ex.getMessage()
            );
        }
    }
}

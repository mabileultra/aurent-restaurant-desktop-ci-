package com.pos.pharmacy.revenue.service.impl;

import com.pos.pharmacy.revenue.service.RevenueOutboxDispatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RevenueOutboxDispatchServiceImpl implements RevenueOutboxDispatchService {

    private final RevenueOutboxAsyncSender asyncSender;

    @Override
    public void dispatchAfterCommit(UUID outboxId) {
        if (outboxId == null) {
            return;
        }
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            asyncSender.send(outboxId);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                asyncSender.send(outboxId);
            }
        });
    }
}

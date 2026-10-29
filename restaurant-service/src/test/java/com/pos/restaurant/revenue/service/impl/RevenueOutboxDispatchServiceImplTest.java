package com.pos.restaurant.revenue.service.impl;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class RevenueOutboxDispatchServiceImplTest {

    @Mock
    private RevenueOutboxAsyncSender asyncSender;

    @InjectMocks
    private RevenueOutboxDispatchServiceImpl dispatchService;

    @Test
    void withoutActiveTxSendsImmediatelyOnAsyncSender() {
        UUID id = UUID.randomUUID();
        try (MockedStatic<TransactionSynchronizationManager> tx = mockStatic(TransactionSynchronizationManager.class)) {
            tx.when(TransactionSynchronizationManager::isSynchronizationActive).thenReturn(false);
            dispatchService.dispatchAfterCommit(id);
            verify(asyncSender).send(id);
            tx.verify(() -> TransactionSynchronizationManager.registerSynchronization(any()), never());
        }
    }

    @Test
    void withActiveTxRegistersAfterCommitThenSends() {
        UUID id = UUID.randomUUID();
        try (MockedStatic<TransactionSynchronizationManager> tx = mockStatic(TransactionSynchronizationManager.class)) {
            tx.when(TransactionSynchronizationManager::isSynchronizationActive).thenReturn(true);
            tx.when(() -> TransactionSynchronizationManager.registerSynchronization(any()))
                .thenAnswer(inv -> {
                    TransactionSynchronization sync = inv.getArgument(0);
                    sync.afterCommit();
                    return null;
                });

            dispatchService.dispatchAfterCommit(id);

            verify(asyncSender).send(id);
        }
    }
}

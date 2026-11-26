package com.pos.catalog.service.product.support;

import com.pos.catalog.repository.ProductRepository;
import com.pos.client.catalog.CatalogServiceClient;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.transaction.support.TransactionSynchronization.STATUS_COMMITTED;
import static org.springframework.transaction.support.TransactionSynchronization.STATUS_ROLLED_BACK;

@ExtendWith(MockitoExtension.class)
class CatalogPrimaryLocalRollbackCompensatorTest {

    @Mock
    CatalogServiceClient catalogServiceClient;
    @Mock
    ProductRepository productRepository;

    @AfterEach
    void clearSync() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void onRollbackDeactivatesWhenLocalMissing() {
        TransactionSynchronizationManager.initSynchronization();
        UUID id = UUID.randomUUID();
        when(productRepository.existsById(id)).thenReturn(false);
        when(catalogServiceClient.tryDeactivateProduct(id)).thenReturn(true);

        new CatalogPrimaryLocalRollbackCompensator(catalogServiceClient, productRepository)
            .armDeactivateIfLocalMissing(id);

        for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
            sync.afterCompletion(STATUS_ROLLED_BACK);
        }

        verify(catalogServiceClient).tryDeactivateProduct(id);
    }

    @Test
    void onRollbackSkipsWhenLocalRowExists() {
        TransactionSynchronizationManager.initSynchronization();
        UUID id = UUID.randomUUID();
        when(productRepository.existsById(id)).thenReturn(true);

        new CatalogPrimaryLocalRollbackCompensator(catalogServiceClient, productRepository)
            .armDeactivateIfLocalMissing(id);

        for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
            sync.afterCompletion(STATUS_ROLLED_BACK);
        }

        verify(catalogServiceClient, never()).tryDeactivateProduct(id);
    }

    @Test
    void onCommitDoesNotCompensate() {
        TransactionSynchronizationManager.initSynchronization();
        UUID id = UUID.randomUUID();

        new CatalogPrimaryLocalRollbackCompensator(catalogServiceClient, productRepository)
            .armDeactivateIfLocalMissing(id);

        for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
            sync.afterCompletion(STATUS_COMMITTED);
        }

        verify(catalogServiceClient, never()).tryDeactivateProduct(id);
    }
}

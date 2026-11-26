package com.pos.catalog.service.product.support;

import com.pos.catalog.repository.ProductRepository;
import com.pos.client.catalog.CatalogServiceClient;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;

/**
 * Wave 7: catalog upsert commits outside the local TX. If local mirror save rolls back,
 * deactivate the remote card when no local row remains (create orphan), best-effort.
 */
@Component
@RequiredArgsConstructor
public class CatalogPrimaryLocalRollbackCompensator {

    private final CatalogServiceClient catalogServiceClient;
    private final ProductRepository productRepository;

    public void armDeactivateIfLocalMissing(UUID productId) {
        if (productId == null || !TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_ROLLED_BACK) {
                    return;
                }
                if (productRepository.existsById(productId)) {
                    return;
                }
                boolean ok = catalogServiceClient.tryDeactivateProduct(productId);
                if (ok) {
                    LogUtil.warn(
                        CatalogPrimaryLocalRollbackCompensator.class,
                        "catalog primary rollback compensate: deactivated orphan id={}",
                        productId
                    );
                } else {
                    LogUtil.error(
                        CatalogPrimaryLocalRollbackCompensator.class,
                        "catalog primary rollback compensate FAILED id=" + productId
                    );
                }
            }
        });
    }
}

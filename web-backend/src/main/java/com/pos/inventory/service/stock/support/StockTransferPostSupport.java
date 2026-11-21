package com.pos.inventory.service.stock.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.service.product.support.CatalogManagedProductLoader;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.PosExceptions;
import com.pos.domain.StockMovementType;
import com.pos.inventory.domain.StockTransferStatus;
import com.pos.inventory.entity.StockMovement;
import com.pos.inventory.entity.StockTransfer;
import com.pos.inventory.entity.StockTransferLine;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.service.event.PosDomainEventService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Проведение черновика: −qty на from, +qty на to + движения.
 */
@Component
@RequiredArgsConstructor
public class StockTransferPostSupport {

    private final CatalogManagedProductLoader catalogManagedProductLoader;
    private final StoreStockService storeStockService;
    private final StockMovementPersistence stockMovementPersistence;
    private final PosDomainEventService posDomainEventService;
    private final TenantAccessSupport tenantAccess;

    public void post(StockTransfer transfer, User user) {
        if (!StockTransferStatus.DRAFT.equals(transfer.getStatus())) {
            throw PosExceptions.badRequest("Only DRAFT transfer can be posted");
        }
        if (transfer.getLines() == null || transfer.getLines().isEmpty()) {
            throw PosExceptions.badRequest("Add at least one line");
        }
        Store fromStore = transfer.getFromStore();
        Store toStore = transfer.getToStore();
        UUID transferId = transfer.getId();
        String number = transfer.getTransferNumber();

        Set<UUID> productIds = new LinkedHashSet<>();
        for (StockTransferLine line : transfer.getLines()) {
            productIds.add(line.getProductId());
        }
        Map<UUID, Product> products = catalogManagedProductLoader.requireActiveWithCompany(productIds);

        for (StockTransferLine line : transfer.getLines()) {
            Product product = products.get(line.getProductId());
            if (product == null) {
                throw PosExceptions.notFound("Product", line.getProductId());
            }
            tenantAccess.assertProductBelongsToTenant(product);
            // decrease re-checks under row lock; keep requireAvailable for clearer pre-fail message
            storeStockService.requireAvailable(product, fromStore, line.getQuantity());
            storeStockService.decrease(product, fromStore, line.getQuantity());
            storeStockService.increase(product, toStore, line.getQuantity());

            stockMovementPersistence.save(StockLineCatalogSnapshot.apply(StockMovement.builder(), product)
                .store(fromStore)
                .movementType(StockMovementType.ADJUSTMENT)
                .quantity(line.getQuantity().negate())
                .referenceId(transferId)
                .notes("Перемещение " + number + " → " + toStore.getName())
                .createdBy(user)
                .build());
            stockMovementPersistence.save(StockLineCatalogSnapshot.apply(StockMovement.builder(), product)
                .store(toStore)
                .movementType(StockMovementType.RESTOCK)
                .quantity(line.getQuantity())
                .referenceId(transferId)
                .notes("Перемещение " + number + " ← " + fromStore.getName())
                .createdBy(user)
                .build());
        }

        transfer.setStatus(StockTransferStatus.POSTED);
        posDomainEventService.publishStockTransferAfterCommit(transfer);
        LogUtil.info(
            StockTransferPostSupport.class,
            "Transfer posted: id={} number={} lines={}",
            transferId,
            number,
            transfer.getLines().size()
        );
    }
}

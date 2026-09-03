package com.pos.service.event;

import com.pos.catalog.entity.Product;
import com.pos.catalog.service.ProductAttributeService;
import com.pos.inventory.entity.StockInventory;
import com.pos.inventory.entity.StockMovement;
import com.pos.inventory.entity.StockReceipt;
import com.pos.inventory.entity.StockTransfer;
import com.pos.sales.entity.CashierShift;
import com.pos.sales.entity.Sale;
import com.pos.sales.entity.SaleItem;
import com.pos.sales.entity.ZReport;
import com.pos.service.event.support.DomainEventKafkaPublisher;
import com.pos.service.event.support.DomainEventMappers;
import com.pos.shared.event.ProductSnapshotEvent;
import com.pos.shared.event.SaleCompletedEvent;
import com.pos.shared.event.ShiftClosedEvent;
import com.pos.shared.event.StockInventoryRecordedEvent;
import com.pos.shared.event.StockMovementRecordedEvent;
import com.pos.shared.event.StockReceivedEvent;
import com.pos.shared.event.StockTransferRecordedEvent;
import com.pos.shared.kafka.KafkaTopics;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PosDomainEventService {

    private final ObjectProvider<DomainEventKafkaPublisher> domainEventKafkaPublisher;
    private final ProductAttributeService productAttributeService;

    public void publishSaleCompletedAfterCommit(Sale sale) {
        SaleCompletedEvent event = DomainEventMappers.toSaleCompleted(sale, loadSaleAttributes(sale));
        if (event == null) {
            return;
        }
        publish(KafkaTopics.SALES_COMPLETED, DomainEventMappers.saleKey(sale), event);
    }

    private Map<UUID, Map<String, String>> loadSaleAttributes(Sale sale) {
        if (sale == null || sale.getItems() == null || sale.getItems().isEmpty()) {
            return Map.of();
        }
        Set<UUID> productIds = new HashSet<>();
        for (SaleItem item : sale.getItems()) {
            Product product = item.getProduct();
            if (product != null && product.getId() != null) {
                productIds.add(product.getId());
            }
        }
        Map<UUID, Map<String, String>> result = new HashMap<>();
        for (UUID productId : productIds) {
            result.put(productId, productAttributeService.getAttributes(productId));
        }
        return result;
    }

    public void publishStockReceivedAfterCommit(StockReceipt receipt) {
        StockReceivedEvent event = DomainEventMappers.toStockReceived(receipt);
        if (event == null) {
            return;
        }
        publish(KafkaTopics.STOCK_RECEIVED, DomainEventMappers.stockKey(receipt), event);
    }

    public void publishStockMovementAfterCommit(StockMovement movement, String referenceNumber) {
        StockMovementRecordedEvent event = DomainEventMappers.toStockMovementRecorded(movement, referenceNumber);
        if (event == null) {
            return;
        }
        publish(KafkaTopics.STOCK_MOVEMENT_RECORDED, DomainEventMappers.movementKey(movement), event);
    }

    public void publishProductSnapshotAfterCommit(Product product) {
        ProductSnapshotEvent event = DomainEventMappers.toProductSnapshot(product);
        if (event == null) {
            return;
        }
        publish(KafkaTopics.PRODUCT_SNAPSHOT, DomainEventMappers.productKey(product), event);
    }

    public void publishStockInventoryAfterCommit(StockInventory inventory) {
        StockInventoryRecordedEvent event = DomainEventMappers.toStockInventoryRecorded(inventory);
        if (event == null) {
            return;
        }
        publish(KafkaTopics.STOCK_INVENTORY_RECORDED, DomainEventMappers.inventoryKey(inventory), event);
    }

    public void publishStockTransferAfterCommit(StockTransfer transfer) {
        StockTransferRecordedEvent event = DomainEventMappers.toStockTransferRecorded(transfer);
        if (event == null) {
            return;
        }
        publish(KafkaTopics.STOCK_TRANSFER_RECORDED, DomainEventMappers.transferKey(transfer), event);
    }

    public void publishShiftClosedAfterCommit(ZReport zReport, CashierShift shift) {
        ShiftClosedEvent event = DomainEventMappers.toShiftClosed(zReport, shift);
        if (event == null) {
            return;
        }
        publish(KafkaTopics.SHIFT_CLOSED, DomainEventMappers.shiftKey(zReport, shift), event);
    }

    private void publish(String topic, String key, Object event) {
        DomainEventKafkaPublisher publisher = domainEventKafkaPublisher.getIfAvailable();
        if (publisher == null) {
            return;
        }
        publisher.publishAfterCommit(topic, key, event);
    }
}

package com.pos.reporting.kafka;

import com.pos.reporting.service.ReportingIngestService;
import com.pos.shared.event.ProductSnapshotEvent;
import com.pos.shared.event.SaleCompletedEvent;
import com.pos.shared.event.ShiftClosedEvent;
import com.pos.shared.event.StockInventoryRecordedEvent;
import com.pos.shared.event.StockMovementRecordedEvent;
import com.pos.shared.event.StockReceivedEvent;
import com.pos.shared.event.StockTransferRecordedEvent;
import com.pos.shared.kafka.KafkaTopics;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.kafka.consumer", name = "enabled", havingValue = "true", matchIfMissing = true)
public class ReportingKafkaListeners {

    private final ReportingIngestService reportingIngestService;

    @KafkaListener(
        topics = KafkaTopics.SALES_COMPLETED,
        groupId = "reporting-service",
        containerFactory = "saleCompletedKafkaListenerContainerFactory"
    )
    public void onSaleCompleted(SaleCompletedEvent event) {
        reportingIngestService.ingestSale(event);
    }

    @KafkaListener(
        topics = KafkaTopics.STOCK_RECEIVED,
        groupId = "reporting-service",
        containerFactory = "stockReceivedKafkaListenerContainerFactory"
    )
    public void onStockReceived(StockReceivedEvent event) {
        reportingIngestService.ingestStock(event);
    }

    @KafkaListener(
        topics = KafkaTopics.STOCK_MOVEMENT_RECORDED,
        groupId = "reporting-service",
        containerFactory = "stockMovementRecordedKafkaListenerContainerFactory"
    )
    public void onStockMovementRecorded(StockMovementRecordedEvent event) {
        reportingIngestService.ingestMovement(event);
    }

    @KafkaListener(
        topics = KafkaTopics.PRODUCT_SNAPSHOT,
        groupId = "reporting-service",
        containerFactory = "productSnapshotKafkaListenerContainerFactory"
    )
    public void onProductSnapshot(ProductSnapshotEvent event) {
        reportingIngestService.ingestProduct(event);
    }

    @KafkaListener(
        topics = KafkaTopics.STOCK_INVENTORY_RECORDED,
        groupId = "reporting-service",
        containerFactory = "stockInventoryRecordedKafkaListenerContainerFactory"
    )
    public void onStockInventoryRecorded(StockInventoryRecordedEvent event) {
        reportingIngestService.ingestInventory(event);
    }

    @KafkaListener(
        topics = KafkaTopics.STOCK_TRANSFER_RECORDED,
        groupId = "reporting-service",
        containerFactory = "stockTransferRecordedKafkaListenerContainerFactory"
    )
    public void onStockTransferRecorded(StockTransferRecordedEvent event) {
        reportingIngestService.ingestTransfer(event);
    }

    @KafkaListener(
        topics = KafkaTopics.SHIFT_CLOSED,
        groupId = "reporting-service",
        containerFactory = "shiftClosedKafkaListenerContainerFactory"
    )
    public void onShiftClosed(ShiftClosedEvent event) {
        reportingIngestService.ingestShift(event);
    }
}

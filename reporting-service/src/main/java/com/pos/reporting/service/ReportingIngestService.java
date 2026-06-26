package com.pos.reporting.service;

import com.pos.shared.event.ProductSnapshotEvent;
import com.pos.shared.event.SaleCompletedEvent;
import com.pos.shared.event.ShiftClosedEvent;
import com.pos.shared.event.StockInventoryRecordedEvent;
import com.pos.shared.event.StockMovementRecordedEvent;
import com.pos.shared.event.StockReceivedEvent;
import com.pos.shared.event.StockTransferRecordedEvent;

public interface ReportingIngestService {

    boolean ingestSale(SaleCompletedEvent event);
    boolean ingestStock(StockReceivedEvent event);
    boolean ingestMovement(StockMovementRecordedEvent event);
    boolean ingestProduct(ProductSnapshotEvent event);
    boolean ingestInventory(StockInventoryRecordedEvent event);
    boolean ingestTransfer(StockTransferRecordedEvent event);
    boolean ingestShift(ShiftClosedEvent event);
}


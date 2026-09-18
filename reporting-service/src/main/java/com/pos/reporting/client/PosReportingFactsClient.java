package com.pos.reporting.client;

import com.pos.reporting.dto.InventoryFactsPageResponse;
import com.pos.reporting.dto.MovementFactsPageResponse;
import com.pos.reporting.dto.ProductFactsPageResponse;
import com.pos.reporting.dto.ShiftFactsPageResponse;
import com.pos.reporting.dto.StockFactsPageResponse;
import com.pos.reporting.dto.TransferFactsPageResponse;

import java.time.LocalDate;

public interface PosReportingFactsClient {

    StockFactsPageResponse fetchStockPage(LocalDate from, LocalDate to, int page, int size);

    MovementFactsPageResponse fetchMovementPage(LocalDate from, LocalDate to, int page, int size);

    ProductFactsPageResponse fetchProductSnapshotPage(int page, int size);

    InventoryFactsPageResponse fetchInventoryPage(LocalDate from, LocalDate to, int page, int size);

    TransferFactsPageResponse fetchTransferPage(LocalDate from, LocalDate to, int page, int size);

    ShiftFactsPageResponse fetchShiftPage(LocalDate from, LocalDate to, int page, int size);
}

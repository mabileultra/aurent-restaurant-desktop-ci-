package com.pos.inventory.service.report;

import com.pos.dto.shared.PageResponse;
import com.pos.shared.event.StockInventoryRecordedEvent;

import java.time.LocalDate;

public interface InventoryFactsBackfillService {

    PageResponse<StockInventoryRecordedEvent> page(LocalDate from, LocalDate to, int page, int size);
}

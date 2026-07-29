package com.pos.inventory.service.report;

import com.pos.dto.shared.PageResponse;
import com.pos.shared.event.StockTransferRecordedEvent;

import java.time.LocalDate;

public interface TransferFactsBackfillService {

    PageResponse<StockTransferRecordedEvent> page(LocalDate from, LocalDate to, int page, int size);
}

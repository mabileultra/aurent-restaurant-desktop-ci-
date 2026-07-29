package com.pos.inventory.service.report;

import com.pos.dto.shared.PageResponse;
import com.pos.shared.event.StockMovementRecordedEvent;

import java.time.LocalDate;

public interface MovementFactsBackfillService {

    PageResponse<StockMovementRecordedEvent> page(LocalDate from, LocalDate to, int page, int size);
}

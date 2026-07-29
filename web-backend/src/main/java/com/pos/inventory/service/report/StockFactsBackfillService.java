package com.pos.inventory.service.report;

import com.pos.dto.shared.PageResponse;
import com.pos.shared.event.StockReceivedEvent;

import java.time.LocalDate;

public interface StockFactsBackfillService {

    PageResponse<StockReceivedEvent> page(LocalDate from, LocalDate to, int page, int size);
}

package com.pos.sales.service.report;

import com.pos.dto.shared.PageResponse;
import com.pos.shared.event.SaleCompletedEvent;

import java.time.LocalDate;

public interface SaleFactsBackfillService {

    PageResponse<SaleCompletedEvent> page(LocalDate from, LocalDate to, int page, int size);
}

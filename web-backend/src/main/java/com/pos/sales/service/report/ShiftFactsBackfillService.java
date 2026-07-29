package com.pos.sales.service.report;

import com.pos.dto.shared.PageResponse;
import com.pos.shared.event.ShiftClosedEvent;

import java.time.LocalDate;

public interface ShiftFactsBackfillService {

    PageResponse<ShiftClosedEvent> page(LocalDate from, LocalDate to, int page, int size);
}

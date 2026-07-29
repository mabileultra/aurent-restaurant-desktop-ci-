package com.pos.catalog.service.report;

import com.pos.dto.shared.PageResponse;
import com.pos.shared.event.ProductSnapshotEvent;

public interface ProductSnapshotBackfillService {

    PageResponse<ProductSnapshotEvent> page(int page, int size);
}

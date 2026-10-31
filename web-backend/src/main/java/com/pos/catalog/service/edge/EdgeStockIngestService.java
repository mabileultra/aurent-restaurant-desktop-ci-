package com.pos.catalog.service.edge;

import com.pos.catalog.dto.edge.EdgeStockIngestRequest;
import com.pos.catalog.dto.edge.EdgeStockIngestResponse;

public interface EdgeStockIngestService {

    EdgeStockIngestResponse ingest(EdgeStockIngestRequest request);
}

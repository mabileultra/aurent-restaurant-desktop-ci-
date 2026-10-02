package com.pos.restaurant.localfirst.service;

import com.pos.restaurant.localfirst.dto.IngestLocalEventRequest;
import com.pos.restaurant.localfirst.dto.IngestLocalEventResponse;

public interface LocalEventIngestService {

    IngestLocalEventResponse ingest(Integer storeId, IngestLocalEventRequest request);
}

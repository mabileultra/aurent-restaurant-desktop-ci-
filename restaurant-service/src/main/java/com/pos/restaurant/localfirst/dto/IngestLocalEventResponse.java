package com.pos.restaurant.localfirst.dto;

import com.pos.restaurant.localfirst.domain.LocalEventIngestOutcome;

public record IngestLocalEventResponse(
    LocalEventIngestOutcome outcome,
    String deviceId,
    String clientEventId
) {
}

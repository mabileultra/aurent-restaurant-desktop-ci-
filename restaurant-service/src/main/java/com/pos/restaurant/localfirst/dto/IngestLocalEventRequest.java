package com.pos.restaurant.localfirst.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record IngestLocalEventRequest(
    @NotBlank String deviceId,
    @NotBlank String clientEventId,
    @NotBlank String eventType,
    @NotNull JsonNode payload
) {
}

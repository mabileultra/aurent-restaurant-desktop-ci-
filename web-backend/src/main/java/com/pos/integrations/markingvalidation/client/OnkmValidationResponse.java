package com.pos.integrations.markingvalidation.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OnkmValidationResponse(
    Boolean success,
    String message,
    String messageRu,
    String messageLat,
    String code
) {
}

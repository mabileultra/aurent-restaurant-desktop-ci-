package com.pos.integrations.markingvalidation.client;

import com.pos.integrations.markingvalidation.dto.MarkingValidationResponse;

public interface MarkingValidationClient {

    /** Никогда не бросает исключений сети/HTTP — недоступность возвращается как {@code UNAVAILABLE}. */
    MarkingValidationResponse validate(OnkmValidationRequest request);
}

package com.pos.integrations.markingvalidation.service;

import com.pos.integrations.markingvalidation.dto.MarkingValidationResponse;
import com.pos.integrations.markingvalidation.dto.ValidateMarkingRequest;

public interface MarkingValidationService {

    MarkingValidationResponse validate(ValidateMarkingRequest request);
}

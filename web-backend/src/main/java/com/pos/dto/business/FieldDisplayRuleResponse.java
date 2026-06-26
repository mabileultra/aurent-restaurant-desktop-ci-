package com.pos.dto.business;

import com.pos.domain.businessconfig.FieldDisplayEffect;
import com.pos.domain.businessconfig.FieldDisplayOperator;

public record FieldDisplayRuleResponse(
    Integer id,
    String targetFieldKey,
    String triggerFieldKey,
    FieldDisplayOperator operator,
    String triggerValue,
    FieldDisplayEffect effect,
    int sortOrder
) {}

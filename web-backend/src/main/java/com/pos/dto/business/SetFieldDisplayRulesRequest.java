package com.pos.dto.business;

import com.pos.domain.businessconfig.FieldDisplayEffect;
import com.pos.domain.businessconfig.FieldDisplayOperator;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record SetFieldDisplayRulesRequest(
    @NotNull List<FieldDisplayRuleItemRequest> rules
) {

    public record FieldDisplayRuleItemRequest(
        @NotBlank String targetFieldKey,
        @NotBlank String triggerFieldKey,
        @NotNull FieldDisplayOperator operator,
        String triggerValue,
        @NotNull FieldDisplayEffect effect,
        Integer sortOrder
    ) {}
}

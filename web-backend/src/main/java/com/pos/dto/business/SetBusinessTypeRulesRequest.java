package com.pos.dto.business;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record SetBusinessTypeRulesRequest(
    @NotNull List<BusinessTypeRuleItemRequest> rules
) {

    public record BusinessTypeRuleItemRequest(
        @NotBlank String ruleKey,
        @NotBlank String ruleValue
    ) {}
}

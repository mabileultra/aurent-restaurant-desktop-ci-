package com.pos.dto.business;

import com.pos.domain.businessconfig.FieldDisplayEffect;
import com.pos.domain.businessconfig.FieldDisplayOperator;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record SetBusinessTypePriceRulesRequest(
    @NotNull List<BusinessTypePriceRuleItemRequest> rules
) {

    public record BusinessTypePriceRuleItemRequest(
        @NotBlank String ruleKey,
        @NotBlank String ruleValue
    ) {}
}

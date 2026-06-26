package com.pos.dto.business;

public record BusinessTypePriceRuleResponse(
    String ruleKey,
    String ruleValue,
    boolean enabled,
    boolean numeric
) {}

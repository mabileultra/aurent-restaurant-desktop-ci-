package com.pos.dto.business;

public record BusinessTypeRuleResponse(
    String ruleKey,
    String ruleValue,
    boolean enabled
) {}

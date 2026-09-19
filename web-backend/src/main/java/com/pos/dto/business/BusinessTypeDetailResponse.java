package com.pos.dto.business;

import java.util.List;

public record BusinessTypeDetailResponse(
    Integer id,
    String code,
    String name,
    String description,
    boolean active,
    int sortOrder,
    List<BusinessTypeFieldResponse> fields,
    List<BusinessTypeUnitAssignmentResponse> units,
    List<BusinessTypeRuleResponse> rules,
    List<BusinessTypePriceRuleResponse> priceRules,
    List<FieldDisplayRuleResponse> displayRules,
    List<BusinessTypeRuleResponse> formFields
) {}

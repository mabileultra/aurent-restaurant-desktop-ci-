package com.pos.dto.business;

import com.pos.dto.unit.UnitConversionResponse;
import com.pos.dto.unit.UnitResponse;

import java.util.List;

public record BusinessConfigResponse(
    String businessTypeCode,
    String businessTypeName,
    List<BusinessTypeFieldResponse> fields,
    List<UnitResponse> units,
    List<BusinessTypeRuleResponse> rules,
    List<UnitConversionResponse> conversions,
    List<BusinessTypePriceRuleResponse> priceRules,
    List<FieldDisplayRuleResponse> displayRules
) {}

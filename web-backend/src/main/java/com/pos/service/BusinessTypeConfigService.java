package com.pos.service;

import com.pos.dto.business.BusinessTypePriceRuleResponse;
import com.pos.dto.business.BusinessTypeRuleResponse;
import com.pos.dto.business.BusinessTypeUnitAssignmentResponse;
import com.pos.dto.business.FieldDisplayRuleResponse;
import com.pos.dto.business.SetBusinessTypePriceRulesRequest;
import com.pos.dto.business.SetBusinessTypeRulesRequest;
import com.pos.dto.business.SetBusinessTypeUnitsRequest;
import com.pos.dto.business.SetFieldDisplayRulesRequest;

import java.util.List;

public interface BusinessTypeConfigService {

    List<BusinessTypeUnitAssignmentResponse> getUnits(Integer businessTypeId);

    List<BusinessTypeRuleResponse> getRules(Integer businessTypeId);

    List<BusinessTypeRuleResponse> getFormFields(Integer businessTypeId);

    List<BusinessTypePriceRuleResponse> getPriceRules(Integer businessTypeId);

    List<FieldDisplayRuleResponse> getDisplayRules(Integer businessTypeId);

    List<BusinessTypeUnitAssignmentResponse> setUnits(Integer businessTypeId, SetBusinessTypeUnitsRequest request);

    List<BusinessTypeRuleResponse> setRules(Integer businessTypeId, SetBusinessTypeRulesRequest request);

    List<BusinessTypeRuleResponse> setFormFields(Integer businessTypeId, SetBusinessTypeRulesRequest request);

    List<BusinessTypePriceRuleResponse> setPriceRules(Integer businessTypeId, SetBusinessTypePriceRulesRequest request);

    List<FieldDisplayRuleResponse> setDisplayRules(Integer businessTypeId, SetFieldDisplayRulesRequest request);

    void seedDefaultsForType(Integer businessTypeId);
}

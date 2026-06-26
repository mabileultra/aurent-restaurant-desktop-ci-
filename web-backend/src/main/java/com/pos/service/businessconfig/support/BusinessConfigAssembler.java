package com.pos.service.businessconfig.support;

import com.pos.dto.business.BusinessConfigResponse;
import com.pos.dto.business.BusinessTypePriceRuleResponse;
import com.pos.dto.business.BusinessTypeRuleResponse;
import com.pos.dto.unit.UnitConversionResponse;
import com.pos.dto.unit.UnitResponse;
import com.pos.entity.BusinessTypeDefinition;
import com.pos.entity.BusinessTypePriceRule;
import com.pos.entity.BusinessTypeRule;
import com.pos.entity.BusinessTypeUnit;
import com.pos.entity.FieldDisplayRule;
import com.pos.mapper.BusinessTypeMapper;
import com.pos.repository.BusinessTypeRuleRepository;
import com.pos.repository.BusinessTypePriceRuleRepository;
import com.pos.repository.BusinessTypeUnitRepository;
import com.pos.repository.FieldDisplayRuleRepository;
import com.pos.repository.UnitConversionRepository;
import com.pos.service.impl.BusinessTypeConfigServiceImpl;
import com.pos.service.impl.UnitCatalogServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class BusinessConfigAssembler {

    private final BusinessTypeMapper businessTypeMapper;
    private final BusinessTypeUnitRepository unitAssignmentRepository;
    private final BusinessTypeRuleRepository ruleRepository;
    private final BusinessTypePriceRuleRepository priceRuleRepository;
    private final FieldDisplayRuleRepository displayRuleRepository;
    private final UnitConversionRepository unitConversionRepository;

    public BusinessConfigResponse assemble(BusinessTypeDefinition type) {
        List<BusinessTypeUnit> unitRows = unitAssignmentRepository.findDetailedByBusinessTypeId(type.getId());
        List<BusinessTypeRule> ruleRows = ruleRepository.findByBusinessTypeIdOrderByRuleKeyAsc(type.getId());
        List<BusinessTypePriceRule> priceRuleRows =
            priceRuleRepository.findByBusinessTypeIdOrderByRuleKeyAsc(type.getId());
        List<FieldDisplayRule> displayRuleRows =
            displayRuleRepository.findByBusinessTypeIdOrderBySortOrderAscIdAsc(type.getId());
        List<UnitResponse> units = unitRows.stream()
            .map(row -> UnitCatalogServiceImpl.toResponsePublic(row.getUnit()))
            .filter(unit -> unit != null)
            .toList();
        Set<String> unitCodes = new HashSet<>(units.stream().map(UnitResponse::code).toList());
        List<UnitConversionResponse> conversions = unitConversionRepository.findAllByOrderByFromCodeAscToCodeAsc().stream()
            .filter(c -> unitCodes.contains(c.getFromCode()) && unitCodes.contains(c.getToCode()))
            .map(c -> new UnitConversionResponse(c.getFromCode(), c.getToCode(), c.getFactor()))
            .toList();
        List<BusinessTypeRuleResponse> rules = BusinessTypeConfigServiceImpl.mergeRules(ruleRows);
        List<BusinessTypePriceRuleResponse> priceRules =
            BusinessTypeConfigServiceImpl.mergePriceRules(priceRuleRows);
        var displayRules = BusinessTypeConfigServiceImpl.toDisplayRuleResponses(displayRuleRows);
        return new BusinessConfigResponse(
            type.getCode(),
            type.getName(),
            businessTypeMapper.toConfigResponse(type).fields(),
            units,
            rules,
            conversions,
            priceRules,
            displayRules
        );
    }
}

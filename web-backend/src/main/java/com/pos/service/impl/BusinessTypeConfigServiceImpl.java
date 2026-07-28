package com.pos.service.impl;

import com.pos.domain.businessconfig.BusinessPriceRuleCatalog;
import com.pos.domain.businessconfig.BusinessRuleCatalog;
import com.pos.domain.businessconfig.FieldDisplayEffect;
import com.pos.domain.businessconfig.FieldDisplayOperator;
import com.pos.dto.business.BusinessTypePriceRuleResponse;
import com.pos.dto.business.BusinessTypeRuleResponse;
import com.pos.dto.business.BusinessTypeUnitAssignmentResponse;
import com.pos.dto.business.FieldDisplayRuleResponse;
import com.pos.dto.business.SetBusinessTypePriceRulesRequest;
import com.pos.dto.business.SetBusinessTypeRulesRequest;
import com.pos.dto.business.SetBusinessTypeUnitsRequest;
import com.pos.dto.business.SetFieldDisplayRulesRequest;
import com.pos.entity.BusinessTypeDefinition;
import com.pos.entity.BusinessTypePriceRule;
import com.pos.entity.BusinessTypeRule;
import com.pos.entity.BusinessTypeUnit;
import com.pos.entity.FieldDisplayRule;
import com.pos.entity.Unit;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.BusinessTypeDefinitionRepository;
import com.pos.repository.BusinessTypePriceRuleRepository;
import com.pos.repository.BusinessTypeRuleRepository;
import com.pos.repository.BusinessTypeUnitRepository;
import com.pos.repository.FieldDisplayRuleRepository;
import com.pos.repository.UnitRepository;
import com.pos.service.BusinessTypeConfigService;
import com.pos.shared.log.LogUtil;
import com.pos.util.TextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BusinessTypeConfigServiceImpl implements BusinessTypeConfigService {

    private final BusinessTypeUnitRepository unitAssignmentRepository;
    private final BusinessTypeRuleRepository ruleRepository;
    private final BusinessTypePriceRuleRepository priceRuleRepository;
    private final FieldDisplayRuleRepository displayRuleRepository;
    private final BusinessTypeDefinitionRepository typeRepository;
    private final UnitRepository unitRepository;

    @Override
    @Transactional(readOnly = true)
    public List<BusinessTypeUnitAssignmentResponse> getUnits(Integer businessTypeId) {
        requireType(businessTypeId);
        return toUnitResponses(unitAssignmentRepository.findDetailedByBusinessTypeId(businessTypeId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BusinessTypeRuleResponse> getRules(Integer businessTypeId) {
        requireType(businessTypeId);
        return mergeRules(ruleRepository.findByBusinessTypeIdOrderByRuleKeyAsc(businessTypeId));
    }

    @Override
    @CacheEvict(value = "businessConfig", allEntries = true)
    public List<BusinessTypeUnitAssignmentResponse> setUnits(Integer businessTypeId, SetBusinessTypeUnitsRequest request) {
        requireType(businessTypeId);
        List<String> codes = request.unitCodes().stream()
            .map(code -> code.trim().toUpperCase())
            .distinct()
            .toList();
        List<Unit> units = unitRepository.findAllById(codes);
        if (units.size() != codes.size()) {
            throw new BadRequestException("Unknown unit code in selection");
        }
        if (units.stream().anyMatch(unit -> !unit.isEnabled() || !unit.isStockAllowed())) {
            throw new BadRequestException("Unit is not allowed for stock");
        }

        String defaultCode = StringUtils.hasText(request.defaultUnitCode())
            ? request.defaultUnitCode().trim().toUpperCase()
            : codes.get(0);
        if (!codes.contains(defaultCode)) {
            throw new BadRequestException("Default unit must be included in selection");
        }

        unitAssignmentRepository.deleteByBusinessTypeId(businessTypeId);
        List<BusinessTypeUnit> rows = new ArrayList<>();
        for (String code : codes) {
            Unit unit = units.stream().filter(u -> u.getCode().equals(code)).findFirst().orElseThrow();
            rows.add(BusinessTypeUnit.builder()
                .businessTypeId(businessTypeId)
                .unitCode(code)
                .defaultUnit(code.equals(defaultCode))
                .sortOrder(unit.getSortOrder())
                .build());
        }
        unitAssignmentRepository.saveAll(rows);
        LogUtil.info(BusinessTypeConfigServiceImpl.class, "Business type units updated: typeId={}, count={}",
            businessTypeId, rows.size());
        return getUnits(businessTypeId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BusinessTypePriceRuleResponse> getPriceRules(Integer businessTypeId) {
        requireType(businessTypeId);
        return mergePriceRules(priceRuleRepository.findByBusinessTypeIdOrderByRuleKeyAsc(businessTypeId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<FieldDisplayRuleResponse> getDisplayRules(Integer businessTypeId) {
        requireType(businessTypeId);
        return toDisplayRuleResponses(displayRuleRepository.findByBusinessTypeIdOrderBySortOrderAscIdAsc(businessTypeId));
    }

    @Override
    @CacheEvict(value = "businessConfig", allEntries = true)
    public List<BusinessTypeRuleResponse> setRules(Integer businessTypeId, SetBusinessTypeRulesRequest request) {
        requireType(businessTypeId);
        Set<String> allowedKeys = BusinessRuleCatalog.ALL.stream()
            .map(BusinessRuleCatalog.RuleDefinition::key)
            .collect(Collectors.toSet());

        ruleRepository.deleteByBusinessTypeId(businessTypeId);
        List<BusinessTypeRule> rows = request.rules().stream()
            .filter(item -> allowedKeys.contains(item.ruleKey()))
            .map(item -> BusinessTypeRule.builder()
                .businessTypeId(businessTypeId)
                .ruleKey(item.ruleKey())
                .ruleValue(item.ruleValue())
                .build())
            .toList();
        ruleRepository.saveAll(rows);
        LogUtil.info(BusinessTypeConfigServiceImpl.class, "Business type rules updated: typeId={}, count={}",
            businessTypeId, rows.size());
        return getRules(businessTypeId);
    }

    @Override
    @CacheEvict(value = "businessConfig", allEntries = true)
    public List<BusinessTypePriceRuleResponse> setPriceRules(
        Integer businessTypeId,
        SetBusinessTypePriceRulesRequest request
    ) {
        requireType(businessTypeId);
        Set<String> allowedKeys = BusinessPriceRuleCatalog.ALL.stream()
            .map(BusinessPriceRuleCatalog.RuleDefinition::key)
            .collect(Collectors.toSet());

        priceRuleRepository.deleteByBusinessTypeId(businessTypeId);
        List<BusinessTypePriceRule> rows = request.rules().stream()
            .filter(item -> allowedKeys.contains(item.ruleKey()))
            .map(item -> BusinessTypePriceRule.builder()
                .businessTypeId(businessTypeId)
                .ruleKey(item.ruleKey())
                .ruleValue(item.ruleValue().trim())
                .build())
            .toList();
        priceRuleRepository.saveAll(rows);
        LogUtil.info(BusinessTypeConfigServiceImpl.class, "Business type price rules updated: typeId={}, count={}",
            businessTypeId, rows.size());
        return getPriceRules(businessTypeId);
    }

    @Override
    @CacheEvict(value = "businessConfig", allEntries = true)
    public List<FieldDisplayRuleResponse> setDisplayRules(
        Integer businessTypeId,
        SetFieldDisplayRulesRequest request
    ) {
        requireType(businessTypeId);
        displayRuleRepository.deleteByBusinessTypeId(businessTypeId);
        int order = 10;
        List<FieldDisplayRule> rows = new ArrayList<>();
        for (SetFieldDisplayRulesRequest.FieldDisplayRuleItemRequest item : request.rules()) {
            String target = item.targetFieldKey().trim().toLowerCase();
            String trigger = item.triggerFieldKey().trim().toLowerCase();
            if (target.equals(trigger)) {
                throw new BadRequestException("Target and trigger field must differ");
            }
            rows.add(FieldDisplayRule.builder()
                .businessTypeId(businessTypeId)
                .targetFieldKey(target)
                .triggerFieldKey(trigger)
                .operator(item.operator())
                .triggerValue(TextUtil.trimOrNull(item.triggerValue()))
                .effect(item.effect())
                .sortOrder(item.sortOrder() != null ? item.sortOrder() : order)
                .build());
            order += 10;
        }
        displayRuleRepository.saveAll(rows);
        LogUtil.info(BusinessTypeConfigServiceImpl.class, "Field display rules updated: typeId={}, count={}",
            businessTypeId, rows.size());
        return getDisplayRules(businessTypeId);
    }

    @Override
    public void seedDefaultsForType(Integer businessTypeId) {
        if (!unitAssignmentRepository.findDetailedByBusinessTypeId(businessTypeId).isEmpty()) {
            return;
        }
        List<Unit> stockUnits = unitRepository.findByEnabledTrueAndStockAllowedTrueOrderBySortOrderAscCodeAsc();
        List<BusinessTypeUnit> rows = stockUnits.stream()
            .map(unit -> BusinessTypeUnit.builder()
                .businessTypeId(businessTypeId)
                .unitCode(unit.getCode())
                .defaultUnit("PCS".equals(unit.getCode()))
                .sortOrder(unit.getSortOrder())
                .build())
            .toList();
        unitAssignmentRepository.saveAll(rows);
    }

    private BusinessTypeDefinition requireType(Integer businessTypeId) {
        return typeRepository.findById(businessTypeId)
            .orElseThrow(() -> new ResourceNotFoundException("Business type not found"));
    }

    static List<BusinessTypeUnitAssignmentResponse> toUnitResponses(List<BusinessTypeUnit> rows) {
        return rows.stream()
            .map(row -> new BusinessTypeUnitAssignmentResponse(
                row.getUnitCode(),
                row.getUnit() != null ? row.getUnit().getLabelRu() : row.getUnitCode(),
                row.getUnit() != null ? row.getUnit().getLabelShortRu() : row.getUnitCode(),
                row.getUnit() != null ? row.getUnit().getCategory().name() : "COUNT",
                row.isDefaultUnit(),
                row.getSortOrder()
            ))
            .toList();
    }

    public static List<BusinessTypeRuleResponse> mergeRules(List<BusinessTypeRule> stored) {
        Map<String, String> values = stored.stream()
            .collect(Collectors.toMap(BusinessTypeRule::getRuleKey, BusinessTypeRule::getRuleValue, (a, b) -> b));
        return BusinessRuleCatalog.ALL.stream()
            .map(def -> {
                String value = values.getOrDefault(def.key(), String.valueOf(def.defaultValue()));
                return new BusinessTypeRuleResponse(def.key(), value, BusinessRuleCatalog.parseBoolean(value));
            })
            .toList();
    }

    public static List<BusinessTypePriceRuleResponse> mergePriceRules(List<BusinessTypePriceRule> stored) {
        Map<String, String> values = stored.stream()
            .collect(Collectors.toMap(BusinessTypePriceRule::getRuleKey, BusinessTypePriceRule::getRuleValue, (a, b) -> b));
        return BusinessPriceRuleCatalog.ALL.stream()
            .map(def -> {
                String value = values.getOrDefault(def.key(), def.defaultValue());
                return new BusinessTypePriceRuleResponse(
                    def.key(),
                    value,
                    !def.numeric() && BusinessRuleCatalog.parseBoolean(value),
                    def.numeric()
                );
            })
            .toList();
    }

    public static List<FieldDisplayRuleResponse> toDisplayRuleResponses(List<FieldDisplayRule> rows) {
        return rows.stream()
            .map(row -> new FieldDisplayRuleResponse(
                row.getId(),
                row.getTargetFieldKey(),
                row.getTriggerFieldKey(),
                row.getOperator(),
                row.getTriggerValue(),
                row.getEffect(),
                row.getSortOrder()
            ))
            .toList();
    }

    static Map<String, String> rulesAsMap(List<BusinessTypeRule> stored) {
        Map<String, String> map = new LinkedHashMap<>();
        for (BusinessRuleCatalog.RuleDefinition def : BusinessRuleCatalog.ALL) {
            map.put(def.key(), String.valueOf(def.defaultValue()));
        }
        for (BusinessTypeRule rule : stored) {
            map.put(rule.getRuleKey(), rule.getRuleValue());
        }
        return map;
    }
}

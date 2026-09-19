package com.pos.mapper;

import com.pos.dto.business.*;
import com.pos.entity.BusinessTypeDefinition;
import com.pos.entity.BusinessTypeField;
import com.pos.service.businessconfig.support.BusinessTypeFieldOptionsResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class BusinessTypeMapper {

    private final BusinessTypeFieldOptionsResolver fieldOptionsResolver;

    public BusinessTypeResponse toResponse(BusinessTypeDefinition entity) {
        int fieldsCount = entity.getFields() == null ? 0 : entity.getFields().size();
        return new BusinessTypeResponse(
            entity.getId(),
            entity.getCode(),
            entity.getName(),
            entity.getDescription(),
            entity.isActive(),
            entity.getSortOrder(),
            fieldsCount
        );
    }

    public BusinessTypeDetailResponse toDetailResponse(
        BusinessTypeDefinition entity,
        List<BusinessTypeUnitAssignmentResponse> units,
        List<BusinessTypeRuleResponse> rules,
        List<BusinessTypePriceRuleResponse> priceRules,
        List<FieldDisplayRuleResponse> displayRules,
        List<BusinessTypeRuleResponse> formFields
    ) {
        return new BusinessTypeDetailResponse(
            entity.getId(),
            entity.getCode(),
            entity.getName(),
            entity.getDescription(),
            entity.isActive(),
            entity.getSortOrder(),
            toFieldResponses(entity.getFields()),
            units,
            rules,
            priceRules,
            displayRules,
            formFields
        );
    }

    public BusinessConfigResponse toConfigResponse(BusinessTypeDefinition entity) {
        List<BusinessTypeFieldResponse> fields = entity.getFields() == null
            ? List.of()
            : entity.getFields().stream()
                .filter(BusinessTypeField::isEnabled)
                .sorted(java.util.Comparator.comparingInt(BusinessTypeField::getSortOrder).thenComparingInt(BusinessTypeField::getId))
                .map(this::toFieldResponse)
                .toList();
        return new BusinessConfigResponse(
            entity.getCode(),
            entity.getName(),
            fields,
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            List.of()
        );
    }

    public BusinessTypeFieldResponse toFieldResponse(BusinessTypeField field) {
        return new BusinessTypeFieldResponse(
            field.getId(),
            field.getFieldKey(),
            field.getLabel(),
            field.getFieldType(),
            field.isRequired(),
            field.isEnabled(),
            field.isFilterable(),
            field.getSortOrder(),
            field.getPlaceholder(),
            field.getHint(),
            field.getReferenceBook() != null ? field.getReferenceBook().getId() : null,
            field.getReferenceBook() != null ? field.getReferenceBook().getCode() : null,
            fieldOptionsResolver.resolve(field)
        );
    }

    public List<BusinessTypeFieldResponse> toFieldResponses(java.util.Collection<BusinessTypeField> fields) {
        if (fields == null || fields.isEmpty()) {
            return List.of();
        }
        return fields.stream()
            .sorted(java.util.Comparator.comparingInt(BusinessTypeField::getSortOrder).thenComparingInt(BusinessTypeField::getId))
            .map(this::toFieldResponse)
            .toList();
    }
}

package com.pos.service.businessconfig.support;

import com.pos.domain.businessconfig.BusinessTypeCodes;
import com.pos.dto.company.CompanyBusinessTypeItemResponse;
import com.pos.dto.company.CompanyBusinessTypesResponse;
import com.pos.entity.BusinessTypeDefinition;
import com.pos.entity.Company;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.BusinessTypeDefinitionRepository;
import com.pos.service.CompanyBusinessTypeAssignmentService;
import com.pos.util.BusinessTypeParser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class StoreBusinessTypeResolver {

    private final BusinessTypeDefinitionRepository typeRepository;
    private final CompanyBusinessTypeAssignmentService companyBusinessTypeAssignmentService;

    public BusinessTypeDefinition resolveForCreate(Company company, Integer businessTypeId, String businessTypeCode) {
        BusinessTypeDefinition resolved = resolve(company.getId(), businessTypeId, businessTypeCode);
        if (resolved == null) {
            resolved = resolveDefaultForCompany(company.getId());
        }
        if (resolved == null) {
            throw new BadRequestException("Business type is required");
        }
        companyBusinessTypeAssignmentService.assertAllowedForCompany(company.getId(), resolved.getId());
        return resolved;
    }

    public BusinessTypeDefinition resolveForUpdate(
        Integer companyId,
        Integer businessTypeId,
        String businessTypeCode
    ) {
        if (businessTypeId == null && !StringUtils.hasText(businessTypeCode)) {
            return null;
        }
        BusinessTypeDefinition resolved = resolve(companyId, businessTypeId, businessTypeCode);
        if (resolved == null) {
            throw new BadRequestException("Unknown business type");
        }
        companyBusinessTypeAssignmentService.assertAllowedForCompany(companyId, resolved.getId());
        return resolved;
    }

    public String codeFromDefinition(BusinessTypeDefinition definition) {
        if (definition == null) {
            return BusinessTypeCodes.UNIVERSAL;
        }
        return BusinessTypeCodes.normalize(definition.getCode());
    }

    public String codeFromStore(BusinessTypeDefinition definition, String legacyCode) {
        if (definition != null) {
            return definition.getCode();
        }
        return BusinessTypeCodes.normalize(legacyCode);
    }

    private BusinessTypeDefinition resolve(Integer companyId, Integer businessTypeId, String businessTypeCode) {
        if (businessTypeId != null) {
            return typeRepository.findById(businessTypeId)
                .filter(BusinessTypeDefinition::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Business type not found"));
        }
        if (StringUtils.hasText(businessTypeCode)) {
            String parsed = BusinessTypeParser.parseRequired(businessTypeCode);
            return typeRepository.findByCodeIgnoreCase(parsed)
                .filter(BusinessTypeDefinition::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Business type not found"));
        }
        return null;
    }

    private BusinessTypeDefinition resolveDefaultForCompany(Integer companyId) {
        CompanyBusinessTypesResponse response = companyBusinessTypeAssignmentService.getForCompany(companyId);
        if (response.types().isEmpty()) {
            return typeRepository.findByCodeIgnoreCase(BusinessTypeCodes.UNIVERSAL).orElse(null);
        }
        return response.types().stream()
            .filter(CompanyBusinessTypeItemResponse::defaultType)
            .findFirst()
            .flatMap(item -> typeRepository.findById(item.id()))
            .or(() -> typeRepository.findById(response.types().get(0).id()))
            .orElse(null);
    }
}

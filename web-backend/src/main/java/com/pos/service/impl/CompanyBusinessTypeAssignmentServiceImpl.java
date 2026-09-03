package com.pos.service.impl;

import com.pos.domain.businessconfig.BusinessTypeCodes;
import com.pos.dto.company.CompanyBusinessTypeItemResponse;
import com.pos.dto.company.CompanyBusinessTypesResponse;
import com.pos.dto.company.SetCompanyBusinessTypesRequest;
import com.pos.entity.BusinessTypeDefinition;
import com.pos.entity.Company;
import com.pos.entity.CompanyBusinessType;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.BusinessTypeDefinitionRepository;
import com.pos.repository.CompanyBusinessTypeRepository;
import com.pos.repository.CompanyRepository;
import com.pos.service.CompanyBusinessTypeAssignmentService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.BusinessTypeParser;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CompanyBusinessTypeAssignmentServiceImpl implements CompanyBusinessTypeAssignmentService {

    private final CompanyBusinessTypeRepository assignmentRepository;
    private final BusinessTypeDefinitionRepository typeRepository;
    private final CompanyRepository companyRepository;
    private final TenantAccessSupport tenantAccess;

    @Override
    @Transactional(readOnly = true)
    public CompanyBusinessTypesResponse getForCompany(Integer companyId) {
        tenantAccess.requireCompany(companyId);
        return toResponse(assignmentRepository.findDetailedByCompanyId(companyId));
    }

    @Override
    public CompanyBusinessTypesResponse setForCompany(Integer companyId, SetCompanyBusinessTypesRequest request) {
        Company company = tenantAccess.requireCompany(companyId);
        List<Integer> typeIds = request.businessTypeIds().stream().distinct().toList();
        List<BusinessTypeDefinition> types = typeRepository.findAllById(typeIds);
        if (types.size() != typeIds.size()) {
            throw new BadRequestException("Unknown business type in selection");
        }
        Set<Integer> inactive = types.stream().filter(t -> !t.isActive()).map(BusinessTypeDefinition::getId).collect(HashSet::new, Set::add, Set::addAll);
        if (!inactive.isEmpty()) {
            throw new BadRequestException("Inactive business type cannot be assigned");
        }

        Integer defaultId = request.defaultBusinessTypeId();
        if (defaultId == null) {
            defaultId = typeIds.get(0);
        }
        if (!typeIds.contains(defaultId)) {
            throw new BadRequestException("Default business type must be included in selection");
        }

        assignmentRepository.deleteByCompanyId(companyId);
        Map<Integer, BusinessTypeDefinition> typesById = types.stream()
            .collect(Collectors.toMap(BusinessTypeDefinition::getId, Function.identity()));
        List<CompanyBusinessType> rows = new ArrayList<>();
        for (Integer typeId : typeIds) {
            rows.add(CompanyBusinessType.builder()
                .companyId(companyId)
                .businessTypeId(typeId)
                .businessType(typesById.get(typeId))
                .defaultType(typeId.equals(defaultId))
                .build());
        }
        assignmentRepository.saveAll(rows);

        BusinessTypeDefinition defaultType = typesById.get(defaultId);
        if (defaultType != null) {
            String code = BusinessTypeParser.parseOrDefault(defaultType.getCode(), BusinessTypeCodes.UNIVERSAL);
            company.setBusinessType(code);
            companyRepository.save(company);
        }

        LogUtil.info(CompanyBusinessTypeAssignmentServiceImpl.class,
            "Company business types updated: companyId={}, count={}, default={}",
            companyId, rows.size(), defaultType != null ? defaultType.getCode() : null);
        return toResponse(rows);
    }

    @Override
    public void syncFromLegacyType(Integer companyId, String businessTypeCode) {
        if (companyId == null) {
            return;
        }
        if (!assignmentRepository.findDetailedByCompanyId(companyId).isEmpty()) {
            return;
        }
        String parsed = BusinessTypeParser.parseOrDefault(businessTypeCode, BusinessTypeCodes.UNIVERSAL);
        BusinessTypeDefinition type = typeRepository.findByCodeIgnoreCase(parsed)
            .or(() -> typeRepository.findByCodeIgnoreCase(BusinessTypeCodes.UNIVERSAL))
            .orElse(null);
        if (type == null) {
            return;
        }
        assignmentRepository.save(CompanyBusinessType.builder()
            .companyId(companyId)
            .businessTypeId(type.getId())
            .defaultType(true)
            .build());
    }

    @Override
    @Transactional(readOnly = true)
    public void assertAllowedForCompany(Integer companyId, Integer businessTypeId) {
        if (businessTypeId == null) {
            return;
        }
        if (!assignmentRepository.existsByCompanyIdAndBusinessTypeId(companyId, businessTypeId)) {
            throw new BadRequestException("Business type is not allowed for this company");
        }
    }

    private static CompanyBusinessTypesResponse toResponse(List<CompanyBusinessType> rows) {
        List<CompanyBusinessTypeItemResponse> types = rows.stream()
            .map(row -> {
                BusinessTypeDefinition type = row.getBusinessType();
                if (type == null) {
                    throw new IllegalStateException(
                        "Business type is not loaded for company assignment: businessTypeId=" + row.getBusinessTypeId()
                    );
                }
                return new CompanyBusinessTypeItemResponse(
                    type.getId(),
                    type.getCode(),
                    type.getName(),
                    row.isDefaultType()
                );
            })
            .toList();
        String defaultCode = types.stream()
            .filter(CompanyBusinessTypeItemResponse::defaultType)
            .map(CompanyBusinessTypeItemResponse::code)
            .findFirst()
            .orElse(types.isEmpty() ? BusinessTypeCodes.UNIVERSAL : types.get(0).code());
        return new CompanyBusinessTypesResponse(types, defaultCode);
    }
}

package com.pos.service.impl;

import com.pos.dto.company.CompanyBusinessTypesResponse;
import com.pos.entity.Company;
import com.pos.service.CompanyBusinessTypeAssignmentService;
import com.pos.service.CompanyBusinessTypeService;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanyBusinessTypeServiceImpl implements CompanyBusinessTypeService {

    private final TenantAccessSupport tenantAccess;
    private final CompanyBusinessTypeAssignmentService assignmentService;

    @Override
    public CompanyBusinessTypesResponse getForCurrentCompany() {
        Company company = requireCurrentCompany();
        return assignmentService.getForCompany(company.getId());
    }

    private Company requireCurrentCompany() {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        return tenantAccess.requireCompany(companyId);
    }
}

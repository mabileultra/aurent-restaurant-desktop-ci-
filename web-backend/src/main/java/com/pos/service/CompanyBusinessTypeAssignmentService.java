package com.pos.service;

import com.pos.dto.company.CompanyBusinessTypesResponse;
import com.pos.dto.company.SetCompanyBusinessTypesRequest;

public interface CompanyBusinessTypeAssignmentService {

    CompanyBusinessTypesResponse getForCompany(Integer companyId);

    CompanyBusinessTypesResponse setForCompany(Integer companyId, SetCompanyBusinessTypesRequest request);

    void syncFromLegacyType(Integer companyId, String businessTypeCode);

    void assertAllowedForCompany(Integer companyId, Integer businessTypeId);
}

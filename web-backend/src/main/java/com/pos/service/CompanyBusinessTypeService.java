package com.pos.service;

import com.pos.dto.company.CompanyBusinessTypesResponse;

public interface CompanyBusinessTypeService {

    CompanyBusinessTypesResponse getForCurrentCompany();
}

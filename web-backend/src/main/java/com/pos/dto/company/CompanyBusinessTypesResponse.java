package com.pos.dto.company;

import java.util.List;

public record CompanyBusinessTypesResponse(
    List<CompanyBusinessTypeItemResponse> types,
    String defaultTypeCode
) {}

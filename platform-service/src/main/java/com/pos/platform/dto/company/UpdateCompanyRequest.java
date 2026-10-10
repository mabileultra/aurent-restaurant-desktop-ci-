package com.pos.platform.dto.company;

public record UpdateCompanyRequest(
    String name,
    String legalName,
    String tin,
    String address,
    String regionCode,
    String districtCode,
    String phone,
    String businessType,
    Boolean active
) {}

package com.pos.platform.dto.company;

public record CompanyResponse(
    Integer id,
    String name,
    String loginCode,
    String legalName,
    String tin,
    String address,
    String regionCode,
    String districtCode,
    String phone,
    String businessType,
    boolean active,
    int storeCount
) {}

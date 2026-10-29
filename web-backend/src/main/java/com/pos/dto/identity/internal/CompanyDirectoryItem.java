package com.pos.dto.identity.internal;

public record CompanyDirectoryItem(
    Integer id,
    String name,
    String loginCode,
    String regionCode,
    String districtCode,
    String businessType
) {}

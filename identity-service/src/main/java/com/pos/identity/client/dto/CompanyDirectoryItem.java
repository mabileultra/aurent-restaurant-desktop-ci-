package com.pos.identity.client.dto;

public record CompanyDirectoryItem(
    Integer id,
    String name,
    String loginCode,
    String regionCode,
    String districtCode,
    String businessType
) {}

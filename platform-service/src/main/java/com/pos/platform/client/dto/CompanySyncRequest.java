package com.pos.platform.client.dto;

public record CompanySyncRequest(
    String operation,
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
    boolean active
) {}

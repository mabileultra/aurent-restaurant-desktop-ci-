package com.pos.platform.client.dto;

public record CreatePosStoreRequest(
    String name,
    String regionCode,
    String districtCode,
    String phone,
    Integer companyId,
    String businessType,
    Boolean active
) {}

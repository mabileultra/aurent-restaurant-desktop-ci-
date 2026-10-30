package com.pos.dto.store;

public record CompanyStoreGroupResponse(
    Integer companyId,
    String companyName,
    String loginCode,
    String businessType,
    String regionCode,
    String districtCode,
    boolean active,
    long storeCount,
    long activeStoreCount
) {
}

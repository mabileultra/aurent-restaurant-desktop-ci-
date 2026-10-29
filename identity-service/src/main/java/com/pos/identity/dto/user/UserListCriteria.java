package com.pos.identity.dto.user;

public record UserListCriteria(
    String search,
    String searchAlt,
    Integer companyId,
    String businessType,
    String regionCode,
    String districtCode,
    String role,
    Boolean active
) {}

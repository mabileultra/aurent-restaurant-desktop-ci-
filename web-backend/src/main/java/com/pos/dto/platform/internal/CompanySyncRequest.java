package com.pos.dto.platform.internal;

public record CompanySyncRequest(
    String operation,
    Integer id,
    String name,
    String loginCode,
    String legalName,
    String tin,
    String address,
    String phone,
    String businessType,
    boolean active
) {}

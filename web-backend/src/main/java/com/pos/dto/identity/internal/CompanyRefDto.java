package com.pos.dto.identity.internal;

public record CompanyRefDto(
    Integer id,
    String name,
    String loginCode,
    boolean active
) {}

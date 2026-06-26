package com.pos.dto.company;

public record CompanyBusinessTypeItemResponse(
    Integer id,
    String code,
    String name,
    boolean defaultType
) {}

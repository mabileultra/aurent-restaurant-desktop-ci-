package com.pos.identity.client.dto;

public record CompanyDto(
    Integer id,
    String name,
    String loginCode,
    boolean active
) {}

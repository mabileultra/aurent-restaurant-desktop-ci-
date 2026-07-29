package com.pos.catalog.dto.product;

public record ServiceProductDetailsRequest(
    Integer durationMinutes,
    Boolean requiresAppointment
) {}

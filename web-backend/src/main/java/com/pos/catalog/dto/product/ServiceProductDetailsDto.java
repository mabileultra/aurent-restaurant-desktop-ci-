package com.pos.catalog.dto.product;

public record ServiceProductDetailsDto(
    Integer durationMinutes,
    boolean requiresAppointment
) {}

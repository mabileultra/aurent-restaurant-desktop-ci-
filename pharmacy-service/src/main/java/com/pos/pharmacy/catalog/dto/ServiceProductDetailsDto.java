package com.pos.pharmacy.catalog.dto;

public record ServiceProductDetailsDto(
    Integer durationMinutes,
    boolean requiresAppointment
) {}

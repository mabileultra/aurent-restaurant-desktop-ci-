package com.pos.pharmacy.catalog.dto;

public record ServiceProductDetailsRequest(
    Integer durationMinutes,
    Boolean requiresAppointment
) {}

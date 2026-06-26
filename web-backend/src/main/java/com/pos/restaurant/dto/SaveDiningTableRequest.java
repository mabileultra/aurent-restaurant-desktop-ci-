package com.pos.restaurant.dto;

import com.pos.restaurant.domain.DiningTableStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SaveDiningTableRequest(
    @NotBlank String code,
    String label,
    @NotNull @Min(1) Integer seatCount,
    @NotNull @Min(0) Integer posX,
    @NotNull @Min(0) Integer posY,
    @NotNull @Min(20) Integer width,
    @NotNull @Min(20) Integer height
) {}

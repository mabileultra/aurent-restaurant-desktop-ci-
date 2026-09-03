package com.pos.restaurant.floor.dto;

import com.pos.restaurant.floor.domain.TableStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SaveTableRequest(
    @NotBlank String code,
    String label,
    @NotNull @Min(1) Integer seatCount,
    @NotNull @Min(0) Integer posX,
    @NotNull @Min(0) Integer posY,
    @NotNull @Min(20) Integer width,
    @NotNull @Min(20) Integer height,
    TableStatus status
) {}

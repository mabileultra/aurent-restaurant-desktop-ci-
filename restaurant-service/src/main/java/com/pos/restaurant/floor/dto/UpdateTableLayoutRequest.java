package com.pos.restaurant.floor.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record UpdateTableLayoutRequest(
    @NotEmpty List<@Valid TableLayoutItem> tables
) {
    public record TableLayoutItem(
        @NotNull Integer id,
        @NotNull @Min(0) Integer posX,
        @NotNull @Min(0) Integer posY,
        @NotNull @Min(20) Integer width,
        @NotNull @Min(20) Integer height
    ) {}
}

package com.pos.restaurant.edge.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record EdgeStaffBootstrapRequest(
    @NotNull Integer companyId,
    String companyLoginCode,
    /** Optional gate for first bootstrap when table is empty. */
    String bootstrapSecret,
    @NotEmpty List<EdgeStaffBootstrapItem> staff
) {}

package com.pos.dto.business;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record SetBusinessTypeUnitsRequest(
    @NotEmpty List<@NotBlank String> unitCodes,
    String defaultUnitCode
) {}

package com.pos.dto.company;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record SetCompanyBusinessTypesRequest(
    @NotEmpty List<@NotNull Integer> businessTypeIds,
    Integer defaultBusinessTypeId
) {}

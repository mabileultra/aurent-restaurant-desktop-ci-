package com.pos.dto.business;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateReferenceBookRequest(
    @NotBlank @Size(max = 200) String name,
    @Size(max = 2000) String description,
    Boolean active,
    @Valid List<SaveReferenceBookEntryRequest> entries
) {}

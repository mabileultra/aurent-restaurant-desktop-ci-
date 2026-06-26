package com.pos.dto.business;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record SaveReferenceBookRequest(
    @NotBlank @Size(max = 64)
    @Pattern(regexp = "^[a-z][a-z0-9_]*$", message = "Code must be lower_snake_case")
    String code,
    @NotBlank @Size(max = 200) String name,
    @Size(max = 2000) String description,
    Boolean active,
    @Valid List<SaveReferenceBookEntryRequest> entries
) {}

package com.pos.restaurant.edge.dto;

import jakarta.validation.constraints.NotBlank;

public record EdgeLoginRequest(
    @NotBlank String username,
    @NotBlank String password
) {}

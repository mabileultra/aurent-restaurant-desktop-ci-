package com.pos.restaurant.edge.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record EdgeStoreBootstrapRequest(
    @NotNull Integer companyId,
    String bootstrapSecret,
    List<EdgeStoreBootstrapItem> stores
) {}

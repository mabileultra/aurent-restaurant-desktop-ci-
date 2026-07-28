package com.pos.inventory.dto.supplier;

import jakarta.validation.constraints.NotBlank;

public record CreateSupplierRequest(
    @NotBlank String name,
    @NotBlank String taxId,
    String address,
    String email,
    String phone
) {}

package com.pos.inventory.dto.supplier;

import jakarta.validation.constraints.NotBlank;

public record UpdateSupplierRequest(
    @NotBlank String name,
    @NotBlank String taxId,
    @NotBlank String accountNumber,
    @NotBlank String phone
) {}

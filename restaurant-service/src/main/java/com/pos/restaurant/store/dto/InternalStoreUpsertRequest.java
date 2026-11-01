package com.pos.restaurant.store.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Cloud pos-core → restaurant-db edge_stores mirror. */
public record InternalStoreUpsertRequest(
    @NotNull Integer id,
    @NotNull Integer companyId,
    @NotBlank String name,
    String code,
    String address,
    String phone,
    String businessType,
    Boolean active
) {
}

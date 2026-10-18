package com.pos.restaurant.edge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

/** Electron: after cloud PIN OK, upsert local staff with PIN re-hashed by local secret. */
public record EdgeCloudPinUpsertRequest(
    String bootstrapSecret,
    @NotNull UUID userId,
    @NotBlank String username,
    String email,
    String fullName,
    @NotBlank String role,
    @NotNull Integer companyId,
    String companyLoginCode,
    @NotBlank String pin,
    List<Integer> storeIds,
    List<String> allowedModules,
    Boolean canRequestBill
) {
}

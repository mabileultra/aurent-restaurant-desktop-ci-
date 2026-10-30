package com.pos.restaurant.edge.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record EdgeStaffBootstrapRequest(
    @NotNull Integer companyId,
    String companyLoginCode,
    /** Optional gate for first bootstrap when table is empty. */
    String bootstrapSecret,
    /** Empty allowed only with replaceRoster=true (deactivate all local for company). */
    List<EdgeStaffBootstrapItem> staff,
    /**
     * When true (online reconcile): deactivate local company staff absent from {@code staff}.
     * First-time bootstrap leaves this null/false — does not wipe extras.
     */
    Boolean replaceRoster
) {}

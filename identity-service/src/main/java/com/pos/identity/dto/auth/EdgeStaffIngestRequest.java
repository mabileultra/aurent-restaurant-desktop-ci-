package com.pos.identity.dto.auth;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record EdgeStaffIngestRequest(
    @NotNull List<EdgeStaffIngestItem> staff
) {}

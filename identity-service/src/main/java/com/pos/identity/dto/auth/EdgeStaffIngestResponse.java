package com.pos.identity.dto.auth;

public record EdgeStaffIngestResponse(
    int upserted,
    int skipped,
    int companyId
) {}

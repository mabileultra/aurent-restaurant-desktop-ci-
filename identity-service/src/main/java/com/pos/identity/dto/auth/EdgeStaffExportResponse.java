package com.pos.identity.dto.auth;

import java.util.List;

public record EdgeStaffExportResponse(
    Integer companyId,
    String companyLoginCode,
    List<EdgeStaffExportItem> staff
) {}

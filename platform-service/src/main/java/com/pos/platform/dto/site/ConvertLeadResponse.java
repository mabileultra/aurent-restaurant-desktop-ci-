package com.pos.platform.dto.site;

import com.pos.platform.domain.SiteLeadStatus;

import java.util.UUID;

public record ConvertLeadResponse(
    Integer companyId,
    String companyName,
    String companyLoginCode,
    Integer storeId,
    UUID adminUserId,
    boolean adminCreated,
    String adminUsername,
    String adminPassword,
    SiteLeadStatus leadStatus
) {}

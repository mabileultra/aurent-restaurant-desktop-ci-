package com.pos.platform.dto.site;

import com.pos.platform.domain.SiteLeadStatus;
import jakarta.validation.constraints.Size;

public record UpdateSiteLeadRequest(
    SiteLeadStatus status,
    @Size(max = 4000) String managerNote
) {}

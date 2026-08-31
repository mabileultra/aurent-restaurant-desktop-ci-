package com.pos.platform.dto.site;

import com.pos.platform.domain.SiteLeadStatus;
import com.pos.platform.domain.SiteLeadType;
import com.pos.platform.entity.SiteLead;

import java.time.Instant;
import java.util.UUID;

public record SiteLeadResponse(
    UUID id,
    Instant createdAt,
    Instant updatedAt,
    String name,
    String phone,
    String email,
    SiteLeadType leadType,
    String source,
    String preferredTime,
    String message,
    SiteLeadStatus status,
    String managerNote,
    String locale
) {
    public static SiteLeadResponse from(SiteLead lead) {
        return new SiteLeadResponse(
            lead.getId(),
            lead.getCreatedAt(),
            lead.getUpdatedAt(),
            lead.getName(),
            lead.getPhone(),
            lead.getEmail(),
            lead.getLeadType(),
            lead.getSource(),
            lead.getPreferredTime(),
            lead.getMessage(),
            lead.getStatus(),
            lead.getManagerNote(),
            lead.getLocale()
        );
    }
}

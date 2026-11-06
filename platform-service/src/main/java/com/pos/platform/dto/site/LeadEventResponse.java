package com.pos.platform.dto.site;

import com.pos.platform.domain.LeadEventType;
import com.pos.platform.entity.LeadEvent;

import java.time.Instant;
import java.util.UUID;

public record LeadEventResponse(
    UUID id,
    UUID leadId,
    String eventType,
    String authorName,
    String text,
    Instant createdAt
) {
    public static LeadEventResponse from(LeadEvent event) {
        return new LeadEventResponse(
            event.getId(),
            event.getLead().getId(),
            event.getEventType() == null ? LeadEventType.COMMENT.name() : event.getEventType().name(),
            event.getAuthorName(),
            event.getText(),
            event.getCreatedAt()
        );
    }
}

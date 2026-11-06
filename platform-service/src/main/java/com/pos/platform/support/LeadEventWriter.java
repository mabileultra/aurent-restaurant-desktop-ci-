package com.pos.platform.support;

import com.pos.platform.domain.LeadEventType;
import com.pos.platform.entity.LeadEvent;
import com.pos.platform.entity.SiteLead;
import com.pos.platform.repository.LeadEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class LeadEventWriter {

    private final LeadEventRepository leadEventRepository;

    public LeadEvent write(SiteLead lead, LeadEventType type, String author, String text) {
        return leadEventRepository.save(LeadEvent.builder()
            .lead(lead)
            .eventType(type)
            .authorName(StringUtils.hasText(author) ? author.trim() : "Administrator")
            .text(text)
            .build());
    }
}

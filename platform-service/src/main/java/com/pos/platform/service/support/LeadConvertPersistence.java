package com.pos.platform.service.support;

import com.pos.platform.domain.LeadEventType;
import com.pos.platform.domain.SiteLeadStatus;
import com.pos.platform.entity.SiteLead;
import com.pos.platform.exception.ResourceNotFoundException;
import com.pos.platform.repository.SiteLeadRepository;
import com.pos.platform.support.LeadEventWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class LeadConvertPersistence {

    private final SiteLeadRepository siteLeadRepository;
    private final LeadEventWriter leadEventWriter;

    @Transactional
    public void markConverted(UUID leadId, Integer companyId, boolean markDone, String author, String companyName) {
        SiteLead lead = siteLeadRepository.findById(leadId)
            .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
        lead.setCompanyId(companyId);
        if (markDone) {
            lead.setStatus(SiteLeadStatus.DONE);
        } else if (lead.getStatus() == SiteLeadStatus.NEW) {
            lead.setStatus(SiteLeadStatus.IN_PROGRESS);
        }
        siteLeadRepository.save(lead);
        leadEventWriter.write(
            lead,
            LeadEventType.CONVERTED,
            author,
            "Kompaniyaga aylantirildi: «" + companyName + "» (ID: " + companyId + ")"
        );
    }
}

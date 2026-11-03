package com.pos.platform.service.impl;

import com.pos.platform.domain.LeadEventType;
import com.pos.platform.domain.SiteLeadStatus;
import com.pos.platform.dto.site.ConvertLeadRequest;
import com.pos.platform.dto.site.ConvertLeadResponse;
import com.pos.platform.dto.site.CreateLeadCommentRequest;
import com.pos.platform.dto.site.CreateSiteLeadRequest;
import com.pos.platform.dto.site.LeadEventResponse;
import com.pos.platform.dto.site.LeadStatsResponse;
import com.pos.platform.dto.site.SiteLeadResponse;
import com.pos.platform.dto.site.UpdateSiteLeadRequest;
import com.pos.platform.dto.shared.PageResponse;
import com.pos.platform.entity.SiteLead;
import com.pos.platform.exception.ResourceNotFoundException;
import com.pos.platform.repository.LeadEventRepository;
import com.pos.platform.repository.SiteLeadRepository;
import com.pos.platform.service.SiteLeadService;
import com.pos.platform.service.support.LeadConvertService;
import com.pos.platform.support.LeadActorName;
import com.pos.platform.support.LeadEventWriter;
import com.pos.platform.support.SiteLeadPhoneNormalizer;
import com.pos.platform.util.TextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SiteLeadServiceImpl implements SiteLeadService {

    private final SiteLeadRepository siteLeadRepository;
    private final LeadEventRepository leadEventRepository;
    private final LeadEventWriter leadEventWriter;
    private final LeadConvertService leadConvertService;

    @Override
    @Transactional
    public SiteLeadResponse createPublic(CreateSiteLeadRequest request) {
        SiteLead lead = SiteLead.builder()
            .name(TextUtil.trimOrNull(request.name()))
            .phone(SiteLeadPhoneNormalizer.normalize(request.phone()))
            .email(TextUtil.trimOrNull(request.email()))
            .leadType(request.leadType())
            .source(TextUtil.trimOrNull(request.source()))
            .preferredTime(TextUtil.trimOrNull(request.preferredTime()))
            .message(TextUtil.trimOrNull(request.message()))
            .locale(normalizeLocale(request.locale()))
            .status(SiteLeadStatus.NEW)
            .build();
        SiteLead saved = siteLeadRepository.save(lead);
        leadEventWriter.write(
            saved,
            LeadEventType.CREATED,
            "Sayt",
            "Ariza saytdan keldi · " + saved.getSource()
        );
        return SiteLeadResponse.from(saved);
    }

    @Override
    public PageResponse<SiteLeadResponse> list(SiteLeadStatus status, String search, Pageable pageable) {
        String q = TextUtil.trimOrNull(search);
        return PageResponse.from(
            siteLeadRepository.search(status, q, pageable).map(SiteLeadResponse::from)
        );
    }

    @Override
    public SiteLeadResponse getById(UUID id) {
        return SiteLeadResponse.from(requireLead(id));
    }

    @Override
    @Transactional
    public SiteLeadResponse update(UUID id, UpdateSiteLeadRequest request) {
        SiteLead lead = requireLead(id);
        SiteLeadStatus previous = lead.getStatus();
        if (request.status() != null && request.status() != previous) {
            lead.setStatus(request.status());
            if (request.status() == SiteLeadStatus.REJECTED && request.rejectionReason() != null) {
                lead.setRejectionReason(TextUtil.trimOrNull(request.rejectionReason()));
            }
            String reason = lead.getRejectionReason();
            String text = "Holat: " + previous + " → " + request.status()
                + (reason != null ? ". Sabab: " + reason : "");
            leadEventWriter.write(lead, LeadEventType.STATUS_CHANGE, LeadActorName.current(), text);
        }
        if (request.managerNote() != null) {
            lead.setManagerNote(TextUtil.trimOrNull(request.managerNote()));
        }
        if (request.rejectionReason() != null && request.status() == null) {
            lead.setRejectionReason(TextUtil.trimOrNull(request.rejectionReason()));
        }
        return SiteLeadResponse.from(siteLeadRepository.save(lead));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!siteLeadRepository.existsById(id)) {
            throw new ResourceNotFoundException("Lead not found");
        }
        siteLeadRepository.deleteById(id);
    }

    @Override
    public LeadStatsResponse stats() {
        long total = siteLeadRepository.count();
        long newCount = siteLeadRepository.countByStatus(SiteLeadStatus.NEW);
        long inProgress = siteLeadRepository.countByStatus(SiteLeadStatus.IN_PROGRESS);
        long done = siteLeadRepository.countByStatus(SiteLeadStatus.DONE);
        long rejected = siteLeadRepository.countByStatus(SiteLeadStatus.REJECTED);
        long unanswered = siteLeadRepository.countByStatusAndCreatedAtBefore(
            SiteLeadStatus.NEW,
            Instant.now().minus(Duration.ofDays(1))
        );
        return new LeadStatsResponse(total, newCount, inProgress, done, rejected, unanswered);
    }

    @Override
    @Transactional
    public LeadEventResponse addComment(UUID id, CreateLeadCommentRequest request) {
        SiteLead lead = requireLead(id);
        return LeadEventResponse.from(leadEventWriter.write(
            lead,
            LeadEventType.COMMENT,
            LeadActorName.current(),
            request.text().trim()
        ));
    }

    @Override
    public List<LeadEventResponse> events(UUID id) {
        requireLead(id);
        return leadEventRepository.findByLead_IdOrderByCreatedAtDesc(id).stream()
            .map(LeadEventResponse::from)
            .toList();
    }

    @Override
    public ConvertLeadResponse convert(UUID id, ConvertLeadRequest request) {
        return leadConvertService.convert(id, request);
    }

    private SiteLead requireLead(UUID id) {
        return siteLeadRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
    }

    private static String normalizeLocale(String locale) {
        if (locale == null || locale.isBlank()) {
            return "ru";
        }
        return locale.trim().toLowerCase();
    }
}

package com.pos.platform.service.impl;

import com.pos.platform.domain.SiteLeadStatus;
import com.pos.platform.dto.site.CreateSiteLeadRequest;
import com.pos.platform.dto.site.SiteLeadResponse;
import com.pos.platform.dto.site.UpdateSiteLeadRequest;
import com.pos.platform.dto.shared.PageResponse;
import com.pos.platform.entity.SiteLead;
import com.pos.platform.exception.ResourceNotFoundException;
import com.pos.platform.repository.SiteLeadRepository;
import com.pos.platform.service.SiteLeadService;
import com.pos.platform.support.SiteLeadPhoneNormalizer;
import com.pos.platform.util.TextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SiteLeadServiceImpl implements SiteLeadService {

    private final SiteLeadRepository siteLeadRepository;

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
        return SiteLeadResponse.from(siteLeadRepository.save(lead));
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
        if (request.status() != null) {
            lead.setStatus(request.status());
        }
        if (request.managerNote() != null) {
            lead.setManagerNote(TextUtil.trimOrNull(request.managerNote()));
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

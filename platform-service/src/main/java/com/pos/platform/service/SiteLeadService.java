package com.pos.platform.service;

import com.pos.platform.dto.site.ConvertLeadRequest;
import com.pos.platform.dto.site.ConvertLeadResponse;
import com.pos.platform.dto.site.CreateLeadCommentRequest;
import com.pos.platform.dto.site.CreateSiteLeadRequest;
import com.pos.platform.dto.site.LeadEventResponse;
import com.pos.platform.dto.site.LeadStatsResponse;
import com.pos.platform.dto.site.SiteLeadResponse;
import com.pos.platform.dto.site.UpdateSiteLeadRequest;
import com.pos.platform.dto.shared.PageResponse;
import com.pos.platform.domain.SiteLeadStatus;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface SiteLeadService {

    SiteLeadResponse createPublic(CreateSiteLeadRequest request);

    PageResponse<SiteLeadResponse> list(SiteLeadStatus status, String search, Pageable pageable);

    SiteLeadResponse getById(UUID id);

    SiteLeadResponse update(UUID id, UpdateSiteLeadRequest request);

    void delete(UUID id);

    LeadStatsResponse stats();

    LeadEventResponse addComment(UUID id, CreateLeadCommentRequest request);

    List<LeadEventResponse> events(UUID id);

    ConvertLeadResponse convert(UUID id, ConvertLeadRequest request);
}

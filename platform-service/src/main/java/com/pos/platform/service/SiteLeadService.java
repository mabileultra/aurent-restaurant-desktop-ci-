package com.pos.platform.service;

import com.pos.platform.dto.site.CreateSiteLeadRequest;
import com.pos.platform.dto.site.SiteLeadResponse;
import com.pos.platform.dto.site.UpdateSiteLeadRequest;
import com.pos.platform.dto.shared.PageResponse;
import com.pos.platform.domain.SiteLeadStatus;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface SiteLeadService {

    SiteLeadResponse createPublic(CreateSiteLeadRequest request);

    PageResponse<SiteLeadResponse> list(SiteLeadStatus status, String search, Pageable pageable);

    SiteLeadResponse getById(UUID id);

    SiteLeadResponse update(UUID id, UpdateSiteLeadRequest request);
}

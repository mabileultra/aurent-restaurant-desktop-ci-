package com.pos.service;

import com.pos.dto.shared.PageResponse;
import com.pos.dto.store.CompanyStoreGroupResponse;
import com.pos.dto.store.StoreStatsResponse;
import org.springframework.data.domain.Pageable;

public interface StorePlatformQueryService {

    StoreStatsResponse stats(
        String search,
        String status,
        String businessType,
        String regionCode,
        Integer companyId
    );

    PageResponse<CompanyStoreGroupResponse> listByCompany(
        String search,
        String status,
        String businessType,
        String regionCode,
        Pageable pageable
    );
}

package com.pos.service.platform;

import com.pos.dto.platform.internal.CompanyStoreCountResponse;
import com.pos.dto.platform.internal.CompanyStoreCountsResponse;
import com.pos.dto.platform.internal.CompanyUserCountResponse;

import java.util.List;

public interface PlatformInternalService {

    CompanyStoreCountResponse storeCount(Integer companyId);

    CompanyStoreCountsResponse storeCounts(List<Integer> companyIds);

    CompanyUserCountResponse userCount(Integer companyId);

    void syncCompany(com.pos.dto.platform.internal.CompanySyncRequest request);
}

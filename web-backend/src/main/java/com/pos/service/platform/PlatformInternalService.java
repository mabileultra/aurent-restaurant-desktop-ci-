package com.pos.service.platform;

import com.pos.dto.platform.internal.CompanyStoreCountResponse;
import com.pos.dto.platform.internal.CompanyStoreCountsResponse;

import java.util.List;

public interface PlatformInternalService {

    CompanyStoreCountResponse storeCount(Integer companyId);

    CompanyStoreCountsResponse storeCounts(List<Integer> companyIds);

    void syncCompany(com.pos.dto.platform.internal.CompanySyncRequest request);
}

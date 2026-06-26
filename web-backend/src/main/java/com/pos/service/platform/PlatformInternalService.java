package com.pos.service.platform;

import com.pos.dto.platform.internal.CompanyStoreCountResponse;

public interface PlatformInternalService {

    CompanyStoreCountResponse storeCount(Integer companyId);

    void syncCompany(com.pos.dto.platform.internal.CompanySyncRequest request);
}

package com.pos.service.platform.impl;

import com.pos.dto.platform.internal.CompanyStoreCountResponse;
import com.pos.dto.platform.internal.CompanySyncRequest;
import com.pos.exception.PosExceptions;
import com.pos.repository.StoreRepository;
import com.pos.service.platform.PlatformCompanySyncService;
import com.pos.service.platform.PlatformInternalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlatformInternalServiceImpl implements PlatformInternalService {

    private final StoreRepository storeRepository;
    private final PlatformCompanySyncService platformCompanySyncService;

    @Override
    public CompanyStoreCountResponse storeCount(Integer companyId) {
        if (companyId == null) {
            throw PosExceptions.badRequest("companyId is required");
        }
        return new CompanyStoreCountResponse((int) storeRepository.countByCompanyId(companyId));
    }

    @Override
    @Transactional
    public void syncCompany(CompanySyncRequest request) {
        platformCompanySyncService.sync(request);
    }
}

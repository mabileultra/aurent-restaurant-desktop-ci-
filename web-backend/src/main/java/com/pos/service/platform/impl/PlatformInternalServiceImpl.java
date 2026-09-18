package com.pos.service.platform.impl;

import com.pos.dto.platform.internal.CompanyStoreCountItem;
import com.pos.dto.platform.internal.CompanyStoreCountResponse;
import com.pos.dto.platform.internal.CompanyStoreCountsResponse;
import com.pos.dto.platform.internal.CompanySyncRequest;
import com.pos.exception.PosExceptions;
import com.pos.repository.StoreRepository;
import com.pos.service.platform.PlatformCompanySyncService;
import com.pos.service.platform.PlatformInternalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

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
    public CompanyStoreCountsResponse storeCounts(List<Integer> companyIds) {
        if (companyIds == null || companyIds.isEmpty()) {
            return new CompanyStoreCountsResponse(List.of());
        }
        List<CompanyStoreCountItem> items = new ArrayList<>();
        for (Object[] row : storeRepository.countGroupedByCompanyId(companyIds)) {
            if (row == null || row.length < 2 || row[0] == null || row[1] == null) {
                continue;
            }
            items.add(new CompanyStoreCountItem((Integer) row[0], ((Number) row[1]).intValue()));
        }
        return new CompanyStoreCountsResponse(items);
    }

    @Override
    @Transactional
    public void syncCompany(CompanySyncRequest request) {
        platformCompanySyncService.sync(request);
    }
}

package com.pos.pharmacy.marks.service.impl;

import com.pos.pharmacy.marks.entity.StockMark;
import com.pos.pharmacy.marks.entity.StockMarkStatus;
import com.pos.pharmacy.marks.repository.StockMarkRepository;
import com.pos.pharmacy.marks.service.StockMarkReturnService;
import com.pos.pharmacy.marks.support.StockMarkKeyCollector;
import com.pos.pharmacy.security.PharmacyTenantContext;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StockMarkReturnServiceImpl implements StockMarkReturnService {

    private final StockMarkRepository stockMarkRepository;

    @Override
    @Transactional
    public int restoreOnReturn(Integer storeId, UUID saleId, Collection<String> markCodes) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        if (companyId == null || storeId == null || markCodes == null || markCodes.isEmpty()) {
            return 0;
        }
        Set<String> keys = StockMarkKeyCollector.collectKeys(markCodes);
        if (keys.isEmpty()) {
            return 0;
        }
        List<StockMark> hits = stockMarkRepository.findByCompanyIdAndMarkKeyIn(companyId, keys);
        List<StockMark> toSave = new ArrayList<>();
        for (StockMark hit : hits) {
            if (!storeId.equals(hit.getStoreId())) {
                continue;
            }
            if (hit.getStatus() != StockMarkStatus.SOLD && hit.getStatus() != StockMarkStatus.PENDING_WITHDRAW) {
                continue;
            }
            if (saleId != null && hit.getSaleId() != null && !saleId.equals(hit.getSaleId())) {
                continue;
            }
            hit.setStatus(StockMarkStatus.IN_STOCK);
            hit.setSaleId(null);
            hit.setSoldAt(null);
            hit.setLastWithdrawError(null);
            hit.setAslStatus("RETURNED_TO_STOCK");
            toSave.add(hit);
        }
        if (toSave.isEmpty()) {
            return 0;
        }
        stockMarkRepository.saveAll(toSave);
        LogUtil.info(
            StockMarkReturnServiceImpl.class,
            "Restored {} stock mark rows to IN_STOCK after return saleId={} storeId={}",
            toSave.size(),
            saleId,
            storeId
        );
        return toSave.size();
    }
}

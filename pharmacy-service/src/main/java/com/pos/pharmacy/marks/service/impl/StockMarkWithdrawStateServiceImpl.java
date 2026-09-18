package com.pos.pharmacy.marks.service.impl;

import com.pos.pharmacy.marks.entity.StockMark;
import com.pos.pharmacy.marks.entity.StockMarkStatus;
import com.pos.pharmacy.marks.repository.StockMarkRepository;
import com.pos.pharmacy.marks.service.StockMarkWithdrawStateService;
import com.pos.pharmacy.marks.support.StockMarkKeyCollector;
import com.pos.pharmacy.marks.support.StockMarkKeys;
import com.pos.pharmacy.security.PharmacyTenantContext;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StockMarkWithdrawStateServiceImpl implements StockMarkWithdrawStateService {

    private final StockMarkRepository stockMarkRepository;

    @Override
    @Transactional
    public int markPendingWithdraw(Integer storeId, UUID saleId, Collection<String> markCodes) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        if (companyId == null || storeId == null || saleId == null || markCodes == null || markCodes.isEmpty()) {
            return 0;
        }
        Set<String> keys = new LinkedHashSet<>();
        for (String code : markCodes) {
            if (!StringUtils.hasText(code)) {
                continue;
            }
            keys.addAll(StockMarkKeys.allKeys(code));
        }
        if (keys.isEmpty()) {
            return 0;
        }
        Instant now = Instant.now();
        List<StockMark> hits = stockMarkRepository.findByCompanyIdAndMarkKeyIn(companyId, keys);
        List<StockMark> toSave = new ArrayList<>();
        for (StockMark hit : hits) {
            if (!storeId.equals(hit.getStoreId())) {
                continue;
            }
            if (hit.getStatus() != StockMarkStatus.IN_STOCK) {
                continue;
            }
            hit.setStatus(StockMarkStatus.PENDING_WITHDRAW);
            hit.setSaleId(saleId);
            hit.setSoldAt(now);
            toSave.add(hit);
        }
        if (toSave.isEmpty()) {
            return 0;
        }
        stockMarkRepository.saveAll(toSave);
        LogUtil.info(
            StockMarkWithdrawStateServiceImpl.class,
            "Marked {} stock mark rows PENDING_WITHDRAW saleId={} storeId={}",
            toSave.size(),
            saleId,
            storeId
        );
        return toSave.size();
    }

    @Override
    @Transactional
    public int confirmSold(Integer companyId, Integer storeId, Collection<String> markCodes, String aslStatus) {
        if (companyId == null || storeId == null || markCodes == null || markCodes.isEmpty()) {
            return 0;
        }
        Set<String> keys = StockMarkKeyCollector.collectKeys(markCodes);
        if (keys.isEmpty()) {
            return 0;
        }
        Instant now = Instant.now();
        List<StockMark> hits = stockMarkRepository.findByCompanyIdAndMarkKeyIn(companyId, keys);
        List<StockMark> toSave = new ArrayList<>();
        for (StockMark hit : hits) {
            if (!storeId.equals(hit.getStoreId())) {
                continue;
            }
            if (hit.getStatus() != StockMarkStatus.PENDING_WITHDRAW && hit.getStatus() != StockMarkStatus.IN_STOCK) {
                continue;
            }
            hit.setStatus(StockMarkStatus.SOLD);
            if (StringUtils.hasText(aslStatus)) {
                hit.setAslStatus(aslStatus);
            }
            hit.setSoldAt(now);
            hit.setLastWithdrawAt(now);
            hit.setLastWithdrawError(null);
            hit.setWithdrawAttempts(hit.getWithdrawAttempts() + 1);
            toSave.add(hit);
        }
        if (toSave.isEmpty()) {
            return 0;
        }
        stockMarkRepository.saveAll(toSave);
        LogUtil.info(
            StockMarkWithdrawStateServiceImpl.class,
            "ASL confirm SOLD count={} companyId={} storeId={} aslStatus={}",
            toSave.size(),
            companyId,
            storeId,
            aslStatus
        );
        return toSave.size();
    }

    @Override
    @Transactional
    public void recordWithdrawAttempt(Integer companyId, Integer storeId, Collection<String> markCodes, String error) {
        if (companyId == null || storeId == null || markCodes == null || markCodes.isEmpty()) {
            return;
        }
        Set<String> keys = StockMarkKeyCollector.collectKeys(markCodes);
        if (keys.isEmpty()) {
            return;
        }
        Instant now = Instant.now();
        String trimmedError = StringUtils.hasText(error)
            ? error.substring(0, Math.min(error.length(), 500))
            : null;
        List<StockMark> hits = stockMarkRepository.findByCompanyIdAndMarkKeyIn(companyId, keys);
        List<StockMark> toSave = new ArrayList<>();
        for (StockMark hit : hits) {
            if (!storeId.equals(hit.getStoreId()) || hit.getStatus() != StockMarkStatus.PENDING_WITHDRAW) {
                continue;
            }
            hit.setWithdrawAttempts(hit.getWithdrawAttempts() + 1);
            hit.setLastWithdrawAt(now);
            hit.setLastWithdrawError(trimmedError);
            toSave.add(hit);
        }
        if (!toSave.isEmpty()) {
            stockMarkRepository.saveAll(toSave);
            LogUtil.warn(
                StockMarkWithdrawStateServiceImpl.class,
                "ASL withdraw still pending/failed count={} companyId={} storeId={} error={}",
                toSave.size(),
                companyId,
                storeId,
                trimmedError
            );
        }
    }
}

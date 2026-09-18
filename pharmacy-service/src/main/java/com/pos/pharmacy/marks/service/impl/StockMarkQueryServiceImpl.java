package com.pos.pharmacy.marks.service.impl;

import com.pos.pharmacy.marks.dto.StockMarkCheckResponse;
import com.pos.pharmacy.marks.entity.StockMark;
import com.pos.pharmacy.marks.entity.StockMarkStatus;
import com.pos.pharmacy.marks.repository.StockMarkRepository;
import com.pos.pharmacy.marks.service.StockMarkQueryService;
import com.pos.pharmacy.marks.support.StockMarkKeys;
import com.pos.pharmacy.security.PharmacyTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class StockMarkQueryServiceImpl implements StockMarkQueryService {

    private final StockMarkRepository stockMarkRepository;

    @Override
    @Transactional(readOnly = true)
    public StockMarkCheckResponse findInStock(Integer storeId, String code) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        if (companyId == null || storeId == null || !StringUtils.hasText(code)) {
            return StockMarkCheckResponse.missing();
        }
        Set<String> keys = StockMarkKeys.allKeys(code);
        if (keys.isEmpty()) {
            return StockMarkCheckResponse.missing();
        }
        List<StockMark> hits = stockMarkRepository.findByCompanyIdAndMarkKeyIn(companyId, keys).stream()
            .filter(mark -> storeId.equals(mark.getStoreId()))
            .toList();
        if (hits.isEmpty()) {
            return StockMarkCheckResponse.missing();
        }
        StockMark available = hits.stream()
            .filter(mark -> mark.getStatus() == StockMarkStatus.IN_STOCK)
            .findFirst()
            .orElse(null);
        if (available != null) {
            return new StockMarkCheckResponse(
                true,
                false,
                available.getStatus(),
                available.getProductId(),
                available.getId(),
                available.getStoreId()
            );
        }
        StockMark sold = hits.get(0);
        boolean alreadySold = sold.getStatus() == StockMarkStatus.SOLD
            || sold.getStatus() == StockMarkStatus.PENDING_WITHDRAW;
        return new StockMarkCheckResponse(
            false,
            alreadySold,
            sold.getStatus(),
            sold.getProductId(),
            sold.getId(),
            sold.getStoreId()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockMark> findPendingWithdrawBatch(int limit) {
        List<StockMark> rows = stockMarkRepository.findTop100ByStatusOrderByUpdatedAtAsc(StockMarkStatus.PENDING_WITHDRAW);
        if (limit <= 0 || rows.size() <= limit) {
            return rows;
        }
        return rows.subList(0, limit);
    }
}

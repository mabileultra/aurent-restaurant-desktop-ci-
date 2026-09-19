package com.pos.pharmacy.marks.service.impl;

import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyCommonErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyMarkErrors;
import com.pos.pharmacy.marks.dto.StockMarkRegisterItem;
import com.pos.pharmacy.marks.dto.StockMarkRegisterRequest;
import com.pos.pharmacy.marks.dto.StockMarkRegisterResponse;
import com.pos.pharmacy.marks.entity.StockMark;
import com.pos.pharmacy.marks.entity.StockMarkStatus;
import com.pos.pharmacy.marks.repository.StockMarkRepository;
import com.pos.pharmacy.marks.service.StockMarkRegisterService;
import com.pos.pharmacy.marks.support.StockMarkKeys;
import com.pos.pharmacy.security.PharmacyTenantContext;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StockMarkRegisterServiceImpl implements StockMarkRegisterService {

    private final StockMarkRepository stockMarkRepository;

    @Override
    @Transactional
    public StockMarkRegisterResponse registerInStock(StockMarkRegisterRequest request) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        if (companyId == null) {
            throw PharmacyErrors.of(PharmacyCommonErrors.PHARM_COMPANY_REQUIRED);
        }
        if (request == null || request.storeId() == null || request.items() == null || request.items().isEmpty()) {
            throw PharmacyErrors.of(PharmacyMarkErrors.PHARM_MARK_EMPTY);
        }

        List<StockMark> toSave = new ArrayList<>();
        Set<String> batchKeys = new LinkedHashSet<>();
        Instant now = Instant.now();

        for (StockMarkRegisterItem item : request.items()) {
            if (item == null || item.productId() == null || !StringUtils.hasText(item.markCode())) {
                throw PharmacyErrors.of(PharmacyMarkErrors.PHARM_MARK_ROW_INCOMPLETE);
            }
            Set<String> keys = StockMarkKeys.allKeys(item.markCode());
            if (keys.isEmpty()) {
                throw PharmacyErrors.of(PharmacyMarkErrors.PHARM_MARK_INVALID);
            }
            for (String key : keys) {
                if (!batchKeys.add(key)) {
                    throw PharmacyErrors.of(PharmacyMarkErrors.PHARM_MARK_DUPLICATE);
                }
            }

            List<StockMark> existing = stockMarkRepository.findByCompanyIdAndMarkKeyIn(companyId, keys);
            for (StockMark hit : existing) {
                if (hit.getStatus() != StockMarkStatus.RETURNED) {
                    throw PharmacyErrors.of(
                        PharmacyMarkErrors.PHARM_MARK_ALREADY_ON_STOCK,
                        "markKey",
                        hit.getMarkKey()
                    );
                }
            }

            Map<String, StockMark> byKey = new HashMap<>();
            for (StockMark hit : existing) {
                byKey.put(hit.getMarkKey(), hit);
            }

            String markCode = item.markCode().trim();
            for (String key : keys) {
                StockMark row = byKey.get(key);
                if (row != null) {
                    applyInStock(row, request, item, markCode, key, now);
                    toSave.add(row);
                } else {
                    toSave.add(StockMark.builder()
                        .companyId(companyId)
                        .storeId(request.storeId())
                        .productId(item.productId())
                        .lotId(item.lotId())
                        .receiptId(request.receiptId())
                        .receiptLineId(item.receiptLineId())
                        .markCode(markCode)
                        .markKey(key)
                        .status(StockMarkStatus.IN_STOCK)
                        .aslStatus(item.aslStatus())
                        .verifiedAt(now)
                        .build());
                }
            }
        }

        List<StockMark> saved = stockMarkRepository.saveAll(toSave);
        LogUtil.info(
            StockMarkRegisterServiceImpl.class,
            "Registered {} stock mark rows for storeId={} companyId={}",
            saved.size(),
            request.storeId(),
            companyId
        );
        List<UUID> ids = saved.stream().map(StockMark::getId).distinct().toList();
        return new StockMarkRegisterResponse(saved.size(), ids);
    }

    private static void applyInStock(
        StockMark row,
        StockMarkRegisterRequest request,
        StockMarkRegisterItem item,
        String markCode,
        String key,
        Instant now
    ) {
        row.setStoreId(request.storeId());
        row.setProductId(item.productId());
        row.setLotId(item.lotId());
        row.setReceiptId(request.receiptId());
        row.setReceiptLineId(item.receiptLineId());
        row.setMarkCode(markCode);
        row.setMarkKey(key);
        row.setStatus(StockMarkStatus.IN_STOCK);
        row.setAslStatus(item.aslStatus());
        row.setVerifiedAt(now);
        row.setSaleId(null);
        row.setSoldAt(null);
    }
}

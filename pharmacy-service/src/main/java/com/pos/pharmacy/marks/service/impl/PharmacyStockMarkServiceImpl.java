package com.pos.pharmacy.marks.service.impl;

import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.marks.dto.StockMarkCheckResponse;
import com.pos.pharmacy.marks.dto.StockMarkRegisterItem;
import com.pos.pharmacy.marks.dto.StockMarkRegisterRequest;
import com.pos.pharmacy.marks.dto.StockMarkRegisterResponse;
import com.pos.pharmacy.marks.entity.StockMark;
import com.pos.pharmacy.marks.entity.StockMarkStatus;
import com.pos.pharmacy.marks.repository.StockMarkRepository;
import com.pos.pharmacy.marks.service.PharmacyStockMarkService;
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
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PharmacyStockMarkServiceImpl implements PharmacyStockMarkService {

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
            PharmacyStockMarkServiceImpl.class,
            "Marked {} stock mark rows PENDING_WITHDRAW saleId={} storeId={}",
            toSave.size(),
            saleId,
            storeId
        );
        return toSave.size();
    }

    @Override
    @Transactional
    public StockMarkRegisterResponse registerInStock(StockMarkRegisterRequest request) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        if (companyId == null) {
            throw PharmacyErrors.badRequest("Не определена компания");
        }
        if (request == null || request.storeId() == null || request.items() == null || request.items().isEmpty()) {
            throw PharmacyErrors.badRequest("Нет кодов маркировки для регистрации");
        }

        List<StockMark> toSave = new ArrayList<>();
        Set<String> batchKeys = new LinkedHashSet<>();
        Instant now = Instant.now();

        for (StockMarkRegisterItem item : request.items()) {
            if (item == null || item.productId() == null || !StringUtils.hasText(item.markCode())) {
                throw PharmacyErrors.badRequest("Строка КМ без productId или кода");
            }
            Set<String> keys = StockMarkKeys.allKeys(item.markCode());
            if (keys.isEmpty()) {
                throw PharmacyErrors.badRequest("Некорректный код маркировки");
            }
            for (String key : keys) {
                if (!batchKeys.add(key)) {
                    throw PharmacyErrors.badRequest("В запросе повторён один и тот же код маркировки");
                }
            }

            List<StockMark> existing = stockMarkRepository.findByCompanyIdAndMarkKeyIn(companyId, keys);
            for (StockMark hit : existing) {
                if (hit.getStatus() != StockMarkStatus.RETURNED) {
                    throw PharmacyErrors.badRequest(
                        "Код маркировки уже на складе или продан",
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
            PharmacyStockMarkServiceImpl.class,
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

    @Override
    @Transactional
    public int confirmSold(Integer companyId, Integer storeId, Collection<String> markCodes, String aslStatus) {
        if (companyId == null || storeId == null || markCodes == null || markCodes.isEmpty()) {
            return 0;
        }
        Set<String> keys = collectKeys(markCodes);
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
        return toSave.size();
    }

    @Override
    @Transactional
    public void recordWithdrawAttempt(Integer companyId, Integer storeId, Collection<String> markCodes, String error) {
        if (companyId == null || storeId == null || markCodes == null || markCodes.isEmpty()) {
            return;
        }
        Set<String> keys = collectKeys(markCodes);
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
        }
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

    @Override
    @Transactional
    public int restoreOnReturn(Integer storeId, UUID saleId, Collection<String> markCodes) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        if (companyId == null || storeId == null || markCodes == null || markCodes.isEmpty()) {
            return 0;
        }
        Set<String> keys = collectKeys(markCodes);
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
            PharmacyStockMarkServiceImpl.class,
            "Restored {} stock mark rows to IN_STOCK after return saleId={} storeId={}",
            toSave.size(),
            saleId,
            storeId
        );
        return toSave.size();
    }

    private static Set<String> collectKeys(Collection<String> markCodes) {
        Set<String> keys = new LinkedHashSet<>();
        for (String code : markCodes) {
            if (!StringUtils.hasText(code)) {
                continue;
            }
            keys.addAll(StockMarkKeys.allKeys(code));
        }
        return keys;
    }
}

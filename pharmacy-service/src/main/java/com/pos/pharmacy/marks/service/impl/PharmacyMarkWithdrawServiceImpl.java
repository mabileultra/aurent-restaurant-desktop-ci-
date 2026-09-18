package com.pos.pharmacy.marks.service.impl;

import com.pos.pharmacy.client.PosCoreMarkingClient;
import com.pos.pharmacy.client.dto.PosMarkingWithdrawItem;
import com.pos.pharmacy.client.dto.PosMarkingWithdrawRequest;
import com.pos.pharmacy.client.dto.PosMarkingWithdrawResponse;
import com.pos.pharmacy.config.PharmacyExecutorNames;
import com.pos.pharmacy.marks.entity.StockMark;
import com.pos.pharmacy.marks.service.PharmacyMarkWithdrawService;
import com.pos.pharmacy.marks.service.PharmacyStockMarkService;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PharmacyMarkWithdrawServiceImpl implements PharmacyMarkWithdrawService {

    private final PosCoreMarkingClient posCoreMarkingClient;
    private final PharmacyStockMarkService stockMarkService;

    @Override
    @Async(PharmacyExecutorNames.MARK_WITHDRAW)
    public void enqueueAfterSale(Integer companyId, Integer storeId, UUID saleId, Collection<String> markCodes) {
        if (companyId == null || storeId == null || markCodes == null || markCodes.isEmpty()) {
            return;
        }
        try {
            processGroup(companyId, storeId, List.copyOf(markCodes), false);
        } catch (Exception ex) {
            LogUtil.warn(
                PharmacyMarkWithdrawServiceImpl.class,
                "Async mark withdraw failed saleId={} storeId={}: {}",
                saleId,
                storeId,
                ex.getMessage()
            );
            stockMarkService.recordWithdrawAttempt(companyId, storeId, markCodes, ex.getMessage());
        }
    }

    @Override
    public int processPendingBatch() {
        List<StockMark> pending = stockMarkService.findPendingWithdrawBatch(50);
        if (pending.isEmpty()) {
            return 0;
        }
        LogUtil.info(
            PharmacyMarkWithdrawServiceImpl.class,
            "ASL withdraw retry batch size={}",
            pending.size()
        );
        Map<String, List<StockMark>> groups = pending.stream()
            .collect(Collectors.groupingBy(
                m -> m.getCompanyId() + ":" + m.getStoreId(),
                LinkedHashMap::new,
                Collectors.toList()
            ));
        int confirmed = 0;
        for (List<StockMark> group : groups.values()) {
            StockMark sample = group.get(0);
            List<String> codes = group.stream()
                .map(StockMark::getMarkCode)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
            confirmed += processGroup(sample.getCompanyId(), sample.getStoreId(), codes, false);
        }
        if (confirmed > 0) {
            LogUtil.info(
                PharmacyMarkWithdrawServiceImpl.class,
                "ASL withdraw retry confirmed={}",
                confirmed
            );
        }
        return confirmed;
    }

    private int processGroup(Integer companyId, Integer storeId, List<String> codes, boolean fiscalConfirmed) {
        if (codes.isEmpty()) {
            return 0;
        }
        LogUtil.info(
            PharmacyMarkWithdrawServiceImpl.class,
            "ASL withdraw poll start companyId={} storeId={} codes={} fiscalConfirmed={}",
            companyId,
            storeId,
            codes.size(),
            fiscalConfirmed
        );
        PosMarkingWithdrawResponse response;
        try {
            response = posCoreMarkingClient.withdraw(new PosMarkingWithdrawRequest(storeId, codes, fiscalConfirmed));
        } catch (Exception ex) {
            LogUtil.warn(
                PharmacyMarkWithdrawServiceImpl.class,
                "ASL withdraw API error companyId={} storeId={} codes={}: {}",
                companyId,
                storeId,
                codes.size(),
                ex.getMessage()
            );
            stockMarkService.recordWithdrawAttempt(companyId, storeId, codes, ex.getMessage());
            return 0;
        }
        if (response == null || response.results() == null) {
            LogUtil.warn(
                PharmacyMarkWithdrawServiceImpl.class,
                "ASL withdraw empty response companyId={} storeId={} codes={}",
                companyId,
                storeId,
                codes.size()
            );
            stockMarkService.recordWithdrawAttempt(companyId, storeId, codes, "empty withdraw response");
            return 0;
        }

        int confirmed = 0;
        int pending = 0;
        int failed = 0;
        List<String> stillPending = new ArrayList<>();
        for (PosMarkingWithdrawItem item : response.results()) {
            if (item == null || !StringUtils.hasText(item.code())) {
                continue;
            }
            if (item.success()) {
                confirmed += stockMarkService.confirmSold(
                    companyId,
                    storeId,
                    List.of(item.code()),
                    item.status()
                );
            } else if (item.pending()) {
                pending += 1;
                stillPending.add(item.code());
            } else {
                failed += 1;
                stockMarkService.recordWithdrawAttempt(
                    companyId,
                    storeId,
                    List.of(item.code()),
                    item.message()
                );
            }
        }
        if (!stillPending.isEmpty()) {
            stockMarkService.recordWithdrawAttempt(companyId, storeId, stillPending, "awaiting OFD/ASL");
        }
        LogUtil.info(
            PharmacyMarkWithdrawServiceImpl.class,
            "ASL withdraw poll done companyId={} storeId={} confirmed={} pending={} failed={}",
            companyId,
            storeId,
            confirmed,
            pending,
            failed
        );
        return confirmed;
    }
}

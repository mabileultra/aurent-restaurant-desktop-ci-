package com.pos.integrations.marking.service.impl;

import com.pos.exception.PosExceptions;
import com.pos.integrations.marking.dto.MarkSoldCheckResponse;
import com.pos.integrations.marking.entity.SaleSoldMark;
import com.pos.integrations.marking.repository.SaleSoldMarkRepository;
import com.pos.integrations.marking.service.MarkingSoldJournalService;
import com.pos.integrations.marking.support.MarkingIdentityKeys;
import com.pos.sales.entity.Sale;
import com.pos.sales.entity.SaleItem;
import com.pos.sales.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MarkingSoldJournalServiceImpl implements MarkingSoldJournalService {

    private final SaleSoldMarkRepository soldMarkRepository;
    private final SaleRepository saleRepository;

    @Override
    @Transactional(readOnly = true)
    public MarkSoldCheckResponse checkSold(Integer companyId, String code) {
        if (companyId == null || !StringUtils.hasText(code)) {
            return new MarkSoldCheckResponse(false, null, null);
        }
        Set<String> keys = MarkingIdentityKeys.keysOf(code);
        if (keys.isEmpty()) {
            return new MarkSoldCheckResponse(false, null, null);
        }
        List<SaleSoldMark> hits = soldMarkRepository.findByCompanyIdAndMarkKeyIn(companyId, keys);
        if (hits.isEmpty()) {
            return new MarkSoldCheckResponse(false, null, null);
        }
        SaleSoldMark hit = hits.get(0);
        String receipt = saleRepository.findById(hit.getSaleId())
            .map(Sale::getReceiptNumber)
            .orElse(null);
        return new MarkSoldCheckResponse(true, "SOLD", receipt);
    }

    @Override
    @Transactional(readOnly = true)
    public void assertNotSold(Integer companyId, List<String> markCodes) {
        Set<String> keys = collectKeys(markCodes);
        if (companyId == null || keys.isEmpty()) {
            return;
        }
        if (soldMarkRepository.existsByCompanyIdAndMarkKeyIn(companyId, keys)) {
            throw PosExceptions.badRequest("Эта маркировка уже пробита в нашей продаже");
        }
    }

    @Override
    @Transactional
    public void registerSaleMarks(Sale sale, List<List<String>> marksPerItem) {
        if (sale == null || sale.getItems() == null || marksPerItem == null) {
            return;
        }
        Integer companyId = companyIdOf(sale);
        Integer storeId = sale.getStore() != null ? sale.getStore().getId() : null;
        if (companyId == null || storeId == null) {
            return;
        }
        List<SaleItem> items = sale.getItems();
        List<SaleSoldMark> rows = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        for (int i = 0; i < items.size() && i < marksPerItem.size(); i++) {
            SaleItem item = items.get(i);
            List<String> marks = marksPerItem.get(i);
            if (marks == null || marks.isEmpty()) {
                continue;
            }
            for (String raw : marks) {
                if (!StringUtils.hasText(raw)) {
                    continue;
                }
                for (String key : MarkingIdentityKeys.keysOf(raw)) {
                    if (!seen.add(key)) {
                        continue;
                    }
                    rows.add(SaleSoldMark.builder()
                        .companyId(companyId)
                        .storeId(storeId)
                        .saleId(sale.getId())
                        .saleItemId(item.getId())
                        .markCode(raw.trim())
                        .markKey(key)
                        .build());
                }
            }
        }
        if (!rows.isEmpty()) {
            soldMarkRepository.saveAll(rows);
        }
    }

    @Override
    @Transactional
    public List<String> unregisterAllForSale(UUID saleId) {
        if (saleId == null) {
            return List.of();
        }
        List<SaleSoldMark> rows = soldMarkRepository.findBySaleId(saleId);
        if (rows.isEmpty()) {
            return List.of();
        }
        List<String> codes = rows.stream()
            .map(SaleSoldMark::getMarkCode)
            .filter(StringUtils::hasText)
            .distinct()
            .toList();
        soldMarkRepository.deleteAll(rows);
        return codes;
    }

    @Override
    @Transactional
    public List<String> unregisterForReturn(UUID saleId, Map<UUID, Integer> limitBySaleItemId) {
        if (saleId == null || limitBySaleItemId == null || limitBySaleItemId.isEmpty()) {
            return List.of();
        }
        List<SaleSoldMark> rows = soldMarkRepository.findBySaleIdAndSaleItemIdIn(
            saleId,
            limitBySaleItemId.keySet()
        );
        return unregisterLimited(rows, limitBySaleItemId);
    }

    private List<String> unregisterLimited(List<SaleSoldMark> rows, Map<UUID, Integer> limitBySaleItemId) {
        if (rows.isEmpty()) {
            return List.of();
        }
        Map<UUID, LinkedHashSet<String>> codesByItem = new LinkedHashMap<>();
        Map<String, List<SaleSoldMark>> rowsByCode = new LinkedHashMap<>();
        for (SaleSoldMark row : rows) {
            if (row.getSaleItemId() == null || !StringUtils.hasText(row.getMarkCode())) {
                continue;
            }
            codesByItem.computeIfAbsent(row.getSaleItemId(), id -> new LinkedHashSet<>()).add(row.getMarkCode());
            rowsByCode.computeIfAbsent(row.getMarkCode(), c -> new ArrayList<>()).add(row);
        }

        List<String> toRemoveCodes = new ArrayList<>();
        List<SaleSoldMark> toDelete = new ArrayList<>();
        for (Map.Entry<UUID, Integer> entry : limitBySaleItemId.entrySet()) {
            int limit = entry.getValue() == null ? 0 : entry.getValue();
            if (limit <= 0) {
                continue;
            }
            LinkedHashSet<String> codes = codesByItem.getOrDefault(entry.getKey(), new LinkedHashSet<>());
            int taken = 0;
            for (String code : codes) {
                if (taken >= limit) {
                    break;
                }
                toRemoveCodes.add(code);
                toDelete.addAll(rowsByCode.getOrDefault(code, List.of()));
                taken++;
            }
        }
        if (!toDelete.isEmpty()) {
            soldMarkRepository.deleteAll(toDelete);
        }
        return toRemoveCodes;
    }

    private static Integer companyIdOf(Sale sale) {
        if (sale.getCompany() != null) {
            return sale.getCompany().getId();
        }
        if (sale.getStore() != null && sale.getStore().getCompany() != null) {
            return sale.getStore().getCompany().getId();
        }
        return null;
    }

    private static Set<String> collectKeys(List<String> markCodes) {
        Set<String> keys = new LinkedHashSet<>();
        if (markCodes == null) {
            return keys;
        }
        for (String code : markCodes) {
            keys.addAll(MarkingIdentityKeys.keysOf(code));
        }
        return keys;
    }
}

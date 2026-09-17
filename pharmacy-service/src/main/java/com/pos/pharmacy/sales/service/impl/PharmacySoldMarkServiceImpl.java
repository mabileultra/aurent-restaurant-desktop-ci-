package com.pos.pharmacy.sales.service.impl;

import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.sales.dto.MarkSoldCheckResponse;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.entity.SaleItem;
import com.pos.pharmacy.sales.entity.SaleSoldMark;
import com.pos.pharmacy.sales.repository.SaleRepository;
import com.pos.pharmacy.sales.repository.SaleSoldMarkRepository;
import com.pos.pharmacy.sales.service.PharmacySoldMarkService;
import com.pos.pharmacy.sales.support.PharmacyMarkIdentityKeys;
import com.pos.pharmacy.security.PharmacyTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PharmacySoldMarkServiceImpl implements PharmacySoldMarkService {

    private final SaleSoldMarkRepository soldMarkRepository;
    private final SaleRepository saleRepository;

    @Override
    @Transactional(readOnly = true)
    public MarkSoldCheckResponse checkSold(Integer storeId, String code) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        if (companyId == null || !StringUtils.hasText(code)) {
            return new MarkSoldCheckResponse(false, null, null);
        }
        Set<String> keys = PharmacyMarkIdentityKeys.keysOf(code);
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
        if (keys.isEmpty()) {
            return;
        }
        if (soldMarkRepository.existsByCompanyIdAndMarkKeyIn(companyId, keys)) {
            throw PharmacyErrors.badRequest("Этот код маркировки уже был продан");
        }
    }

    @Override
    @Transactional
    public void registerSaleMarks(Sale sale, List<SaleItem> items, List<List<String>> marksPerItem) {
        if (sale == null || items == null || marksPerItem == null) {
            return;
        }
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
                for (String key : PharmacyMarkIdentityKeys.keysOf(raw)) {
                    if (!seen.add(key)) {
                        continue;
                    }
                    rows.add(SaleSoldMark.builder()
                        .companyId(sale.getCompanyId())
                        .storeId(sale.getStoreId())
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

    private static Set<String> collectKeys(List<String> markCodes) {
        Set<String> keys = new LinkedHashSet<>();
        if (markCodes == null) {
            return keys;
        }
        for (String code : markCodes) {
            keys.addAll(PharmacyMarkIdentityKeys.keysOf(code));
        }
        return keys;
    }
}

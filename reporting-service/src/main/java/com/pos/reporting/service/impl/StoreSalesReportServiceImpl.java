package com.pos.reporting.service.impl;

import com.pos.reporting.service.StoreSalesReportService;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.StoreSalesRowResponse;
import com.pos.reporting.repository.SaleFactRepository;
import com.pos.reporting.security.ReportingTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StoreSalesReportServiceImpl implements StoreSalesReportService {

    private final SaleFactRepository saleFactRepository;

    @Override
    public PageResponse<StoreSalesRowResponse> byStores(LocalDate from, LocalDate to, Pageable pageable) {
        Integer companyId = ReportingTenantContext.requireCompanyId();
        Page<Object[]> page = saleFactRepository.storeSalesAggregate(companyId, from, to, pageable);
        List<StoreSalesRowResponse> content = page.getContent().stream()
            .map(this::mapRow)
            .toList();
        return new PageResponse<>(
            content,
            page.getTotalPages(),
            page.getTotalElements(),
            page.getSize(),
            page.getNumber()
        );
    }

    private StoreSalesRowResponse mapRow(Object[] row) {
        Integer storeId = row[0] != null ? ((Number) row[0]).intValue() : null;
        String storeName = row[1] != null ? row[1].toString() : (storeId != null ? "Store #" + storeId : "");
        long receiptCount = toLong(row[2]);
        long netQuantity = toLong(row[3]);
        long quantityReturned = toLong(row[4]);
        BigDecimal revenue = toMoney(row[5]);
        BigDecimal costEstimate = toMoney(row[6]);
        BigDecimal margin = revenue.subtract(costEstimate).setScale(2, RoundingMode.HALF_UP);
        return new StoreSalesRowResponse(
            storeId,
            storeName,
            receiptCount,
            netQuantity,
            quantityReturned,
            revenue,
            costEstimate,
            margin
        );
    }

    private static long toLong(Object value) {
        if (value == null) {
            return 0L;
        }
        return ((Number) value).longValue();
    }

    private static BigDecimal toMoney(Object value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        if (value instanceof BigDecimal bd) {
            return bd.setScale(2, RoundingMode.HALF_UP);
        }
        return new BigDecimal(value.toString()).setScale(2, RoundingMode.HALF_UP);
    }
}

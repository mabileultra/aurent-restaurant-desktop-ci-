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
        long receiptCount = row[2] instanceof Number n ? n.longValue() : Long.parseLong(row[2].toString());
        long netQuantity = row[3] instanceof Number n ? n.longValue() : Long.parseLong(row[3].toString());
        BigDecimal revenue = row[4] instanceof BigDecimal bd ? bd : new BigDecimal(row[4].toString());
        return new StoreSalesRowResponse(
            storeId,
            storeName,
            receiptCount,
            netQuantity,
            0L,
            revenue,
            BigDecimal.ZERO,
            BigDecimal.ZERO
        );
    }
}

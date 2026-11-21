package com.pos.reporting.service.impl;

import com.pos.reporting.service.StoreSalesReportService;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.StoreSalesRowResponse;
import com.pos.reporting.repository.SaleFactRepository;
import com.pos.reporting.security.ReportingTenantContext;
import com.pos.reporting.support.ReportingJdbcValues;
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
        Integer storeId = ReportingJdbcValues.toInteger(row[0]);
        String storeName = row[1] != null ? row[1].toString() : (storeId != null ? "Store #" + storeId : "");
        long receiptCount = ReportingJdbcValues.toLong(row[2]);
        long netQuantity = ReportingJdbcValues.toLong(row[3]);
        long quantityReturned = ReportingJdbcValues.toLong(row[4]);
        BigDecimal revenue = ReportingJdbcValues.toMoney(row[5]);
        BigDecimal costEstimate = ReportingJdbcValues.toMoney(row[6]);
        BigDecimal margin = revenue.subtract(costEstimate).setScale(2, RoundingMode.HALF_UP);
        return new StoreSalesRowResponse(
            storeId,
            storeName,
            receiptCount,
            netQuantity,
            quantityReturned,
            revenue,
            costEstimate,
            margin,
            ReportingJdbcValues.toLocalDate(row[7]),
            ReportingJdbcValues.toLocalDate(row[8]),
            ReportingJdbcValues.toInstant(row[9])
        );
    }
}

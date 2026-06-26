package com.pos.reporting.service.impl;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.stock.pos.PosLowStockRow;
import com.pos.reporting.mapper.StockAnalyticsRowMapper;
import com.pos.reporting.repository.StockFactAnalyticsRepository;
import com.pos.reporting.security.ReportingTenantContext;
import com.pos.reporting.service.LowStockReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LowStockReportServiceImpl implements LowStockReportService {

    private final StockFactAnalyticsRepository stockFactAnalyticsRepository;
    private final StockAnalyticsRowMapper stockAnalyticsRowMapper;

    @Override
    public PageResponse<PosLowStockRow> lowStock(Pageable pageable) {
        Page<Object[]> page = stockFactAnalyticsRepository.lowStockPage(
            ReportingTenantContext.requireCompanyId(),
            pageable
        );
        List<PosLowStockRow> content = page.getContent().stream()
            .map(stockAnalyticsRowMapper::toLowStockRow)
            .toList();
        return new PageResponse<>(
            content,
            page.getTotalPages(),
            page.getTotalElements(),
            page.getSize(),
            page.getNumber()
        );
    }
}

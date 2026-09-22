package com.pos.reporting.service.impl;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.stock.pos.PosStockBalanceRow;
import com.pos.reporting.mapper.StockAnalyticsRowMapper;
import com.pos.reporting.repository.StockFactAnalyticsRepository;
import com.pos.reporting.security.ReportingTenantContext;
import com.pos.reporting.service.StockBalanceReportService;
import com.pos.reporting.util.ReportingPageCollector;
import com.pos.reporting.util.ReportingSearchSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockBalanceReportServiceImpl implements StockBalanceReportService {

    private final StockFactAnalyticsRepository stockFactAnalyticsRepository;
    private final StockAnalyticsRowMapper stockAnalyticsRowMapper;

    @Override
    public PageResponse<PosStockBalanceRow> balances(
        Integer storeId,
        Integer categoryId,
        String search,
        boolean onlyWithStock,
        Pageable pageable
    ) {
        Page<Object[]> page = stockFactAnalyticsRepository.balancesPage(
            ReportingTenantContext.requireCompanyId(),
            storeId,
            categoryId,
            ReportingSearchSupport.normalizeLikePattern(search),
            onlyWithStock,
            pageable
        );
        List<PosStockBalanceRow> content = page.getContent().stream()
            .map(stockAnalyticsRowMapper::toBalanceRow)
            .toList();
        return toPageResponse(content, page);
    }

    @Override
    public List<PosStockBalanceRow> listAll(Integer storeId, Integer categoryId, String search, boolean onlyWithStock) {
        return ReportingPageCollector.collectAll(
            (page, size) -> balances(storeId, categoryId, search, onlyWithStock, PageRequest.of(page, size))
        );
    }

    private static <T> PageResponse<T> toPageResponse(List<T> content, Page<?> page) {
        return new PageResponse<>(
            content,
            page.getTotalPages(),
            page.getTotalElements(),
            page.getSize(),
            page.getNumber()
        );
    }
}

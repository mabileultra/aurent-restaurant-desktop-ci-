package com.pos.reporting.service.impl;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.stock.pos.PosDeadStockRow;
import com.pos.reporting.mapper.StockAnalyticsRowMapper;
import com.pos.reporting.repository.StockFactAnalyticsRepository;
import com.pos.reporting.security.ReportingTenantContext;
import com.pos.reporting.service.DeadStockReportService;
import com.pos.reporting.util.ReportingPageCollector;
import com.pos.reporting.util.ReportingSearchSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeadStockReportServiceImpl implements DeadStockReportService {

    private final StockFactAnalyticsRepository stockFactAnalyticsRepository;
    private final StockAnalyticsRowMapper stockAnalyticsRowMapper;

    @Override
    public PageResponse<PosDeadStockRow> deadStock(
        LocalDate asOfDate,
        int daysNoSale,
        Integer categoryId,
        String search,
        Pageable pageable
    ) {
        LocalDate asOf = asOfDate != null ? asOfDate : LocalDate.now();
        int days = Math.max(1, daysNoSale);
        LocalDate cutoff = asOf.minusDays(days);

        Page<Object[]> page = stockFactAnalyticsRepository.deadStockPage(
            ReportingTenantContext.requireCompanyId(),
            asOf,
            cutoff,
            days,
            categoryId,
            ReportingSearchSupport.normalizeLikePattern(search),
            pageable
        );
        List<PosDeadStockRow> content = page.getContent().stream()
            .map(stockAnalyticsRowMapper::toDeadStockRow)
            .toList();
        return new PageResponse<>(
            content,
            page.getTotalPages(),
            page.getTotalElements(),
            page.getSize(),
            page.getNumber()
        );
    }

    @Override
    public List<PosDeadStockRow> listAll(
        LocalDate asOfDate,
        int daysNoSale,
        Integer categoryId,
        String search
    ) {
        return ReportingPageCollector.collectAll(
            (page, size) -> deadStock(asOfDate, daysNoSale, categoryId, search, PageRequest.of(page, size))
        );
    }
}

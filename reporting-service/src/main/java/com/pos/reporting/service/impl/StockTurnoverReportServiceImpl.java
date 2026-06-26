package com.pos.reporting.service.impl;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.stock.pos.PosStockTurnoverRow;
import com.pos.reporting.mapper.StockAnalyticsRowMapper;
import com.pos.reporting.repository.StockFactAnalyticsRepository;
import com.pos.reporting.security.ReportingTenantContext;
import com.pos.reporting.service.StockTurnoverReportService;
import com.pos.reporting.util.ReportingSearchSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockTurnoverReportServiceImpl implements StockTurnoverReportService {

    private final StockFactAnalyticsRepository stockFactAnalyticsRepository;
    private final StockAnalyticsRowMapper stockAnalyticsRowMapper;

    @Override
    public PageResponse<PosStockTurnoverRow> turnover(
        LocalDate from,
        LocalDate to,
        Integer categoryId,
        String search,
        Pageable pageable
    ) {
        Page<Object[]> page = stockFactAnalyticsRepository.turnoverPage(
            ReportingTenantContext.requireCompanyId(),
            from,
            to,
            categoryId,
            ReportingSearchSupport.normalizeLikePattern(search),
            pageable
        );
        List<PosStockTurnoverRow> content = page.getContent().stream()
            .map(stockAnalyticsRowMapper::toTurnoverRow)
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

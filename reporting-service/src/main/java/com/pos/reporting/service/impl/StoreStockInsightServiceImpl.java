package com.pos.reporting.service.impl;

import com.pos.reporting.dto.StoreSalesRowResponse;
import com.pos.reporting.dto.analytics.SoldUnitsByStoreProductRowResponse;
import com.pos.reporting.dto.analytics.StoreProductStockRowResponse;
import com.pos.reporting.dto.analytics.StoreStockInsightResponse;
import com.pos.reporting.dto.analytics.StoreStockTotalRowResponse;
import com.pos.reporting.mapper.StoreStockInsightRowMapper;
import com.pos.reporting.repository.StoreStockInsightRepository;
import com.pos.reporting.security.ReportingTenantContext;
import com.pos.reporting.service.StoreSalesReportService;
import com.pos.reporting.service.StoreStockInsightService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StoreStockInsightServiceImpl implements StoreStockInsightService {

    private final StoreStockInsightRepository storeStockInsightRepository;
    private final StoreSalesReportService storeSalesReportService;
    private final StoreStockInsightRowMapper storeStockInsightRowMapper;

    @Override
    public StoreStockInsightResponse insight(LocalDate from, LocalDate to) {
        Integer companyId = ReportingTenantContext.requireCompanyId();
        List<StoreSalesRowResponse> storeSales = storeSalesReportService
            .byStores(from, to, Pageable.unpaged())
            .content();
        List<StoreStockTotalRowResponse> stockTotalsByStore = storeStockInsightRepository
            .stockTotalsByStore(companyId)
            .stream()
            .map(storeStockInsightRowMapper::toStockTotalRow)
            .toList();
        List<StoreProductStockRowResponse> stockByProductStore = storeStockInsightRepository
            .stockByProductStore(companyId)
            .stream()
            .map(storeStockInsightRowMapper::toProductStockRow)
            .toList();
        List<SoldUnitsByStoreProductRowResponse> soldByProductStore = storeStockInsightRepository
            .soldUnitsByProductStore(companyId, from, to)
            .stream()
            .map(storeStockInsightRowMapper::toSoldUnitsRow)
            .toList();
        return new StoreStockInsightResponse(
            storeSales,
            stockTotalsByStore,
            stockByProductStore,
            soldByProductStore
        );
    }
}

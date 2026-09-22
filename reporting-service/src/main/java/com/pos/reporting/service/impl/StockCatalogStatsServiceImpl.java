package com.pos.reporting.service.impl;

import com.pos.reporting.dto.stock.StockCatalogStatsResponse;
import com.pos.reporting.repository.ProductSnapshotFactRepository;
import com.pos.reporting.repository.StockDashboardFactsRepository;
import com.pos.reporting.security.ReportingTenantContext;
import com.pos.reporting.service.StockCatalogStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockCatalogStatsServiceImpl implements StockCatalogStatsService {

    private final ProductSnapshotFactRepository productSnapshotFactRepository;
    private final StockDashboardFactsRepository stockDashboardFactsRepository;

    @Override
    public StockCatalogStatsResponse catalogStats() {
        Integer companyId = ReportingTenantContext.requireCompanyId();
        long activeProducts = productSnapshotFactRepository.countByCompanyIdAndActiveTrue(companyId);
        long lowStockSkus = stockDashboardFactsRepository.countLowStockSkus(companyId, null);
        return new StockCatalogStatsResponse(activeProducts, lowStockSkus);
    }
}

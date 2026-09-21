package com.pos.reporting.service.impl;

import com.pos.reporting.dto.stock.StockDashboardResponse;
import com.pos.reporting.dto.stock.StockDashboardWriteOffDayPoint;
import com.pos.reporting.export.support.StockDashboardDailyMerger;
import com.pos.reporting.repository.SaleItemFactRepository;
import com.pos.reporting.repository.StockDashboardFactsRepository;
import com.pos.reporting.repository.StockReceiptFactRepository;
import com.pos.reporting.security.ReportingTenantContext;
import com.pos.reporting.service.StockDashboardService;
import com.pos.reporting.util.NativeAggregateRowSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockDashboardServiceImpl implements StockDashboardService {

    private final StockReceiptFactRepository stockReceiptFactRepository;
    private final SaleItemFactRepository saleItemFactRepository;
    private final StockDashboardFactsRepository stockDashboardFactsRepository;

    @Override
    public StockDashboardResponse dashboard(LocalDate from, LocalDate to, Integer storeId) {
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.minusDays(6);

        Integer companyId = ReportingTenantContext.requireCompanyId();
        Object[] receivedTotals = NativeAggregateRowSupport.normalize(
            stockReceiptFactRepository.sumReceivedTotals(companyId, start, end, storeId)
        );
        long receivedUnits = NativeAggregateRowSupport.toLong(receivedTotals, 0);
        BigDecimal receivedCost = NativeAggregateRowSupport.toBigDecimal(receivedTotals, 1);
        List<Object[]> dailyReceived = stockReceiptFactRepository.dailyReceivedUnits(companyId, start, end, storeId);

        // Если фактур за период нет — берём RESTOCK из движений (как в оборотной ведомости).
        if (receivedUnits == 0 && receivedCost.compareTo(BigDecimal.ZERO) == 0) {
            Object[] restockTotals = NativeAggregateRowSupport.normalize(
                stockDashboardFactsRepository.restockTotals(companyId, start, end, storeId)
            );
            receivedUnits = NativeAggregateRowSupport.toLong(restockTotals, 0);
            receivedCost = NativeAggregateRowSupport.toBigDecimal(restockTotals, 1);
            dailyReceived = stockDashboardFactsRepository.dailyRestockUnits(companyId, start, end, storeId);
        }

        long soldUnits = saleItemFactRepository.sumSoldUnits(companyId, start, end, storeId);

        Object[] writeOffTotals = NativeAggregateRowSupport.normalize(
            stockDashboardFactsRepository.writeOffTotals(companyId, start, end, storeId)
        );
        long writeOffUnits = NativeAggregateRowSupport.toLong(writeOffTotals, 0);
        BigDecimal writeOffCost = NativeAggregateRowSupport.toBigDecimal(writeOffTotals, 1);

        Object[] stockTotals = NativeAggregateRowSupport.normalize(
            stockDashboardFactsRepository.currentStockTotals(companyId)
        );
        long currentStockUnits = NativeAggregateRowSupport.toLong(stockTotals, 0);
        BigDecimal currentStockCost = NativeAggregateRowSupport.toBigDecimal(stockTotals, 1);

        long lowStockSkuCount = stockDashboardFactsRepository.countLowStockSkus(companyId);

        List<StockDashboardWriteOffDayPoint> dailyWriteOff = mapDailyWriteOff(
            stockDashboardFactsRepository.dailyWriteOffUnits(companyId, start, end, storeId)
        );

        return new StockDashboardResponse(
            receivedUnits,
            receivedCost,
            soldUnits,
            writeOffUnits,
            writeOffCost,
            currentStockUnits,
            currentStockCost,
            lowStockSkuCount,
            StockDashboardDailyMerger.merge(
                start,
                end,
                dailyReceived,
                saleItemFactRepository.dailySoldUnits(companyId, start, end, storeId),
                dailyWriteOff
            )
        );
    }

    private static List<StockDashboardWriteOffDayPoint> mapDailyWriteOff(List<Object[]> rows) {
        if (rows == null || rows.isEmpty()) {
            return List.of();
        }
        List<StockDashboardWriteOffDayPoint> result = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            result.add(new StockDashboardWriteOffDayPoint(
                row[0].toString(),
                NativeAggregateRowSupport.toLong(row, 1)
            ));
        }
        return result;
    }
}

package com.pos.sales.service.cashier.support;

import com.pos.sales.dto.cashier.ShiftSoldItemsReport;
import com.pos.sales.entity.CashierShift;
import com.pos.sales.repository.sale.ShiftReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Net goods sold in the same window as the closing Z-report
 * (current period, completed and partially refunded sales).
 */
@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShiftSoldItemsLoader {

    private final ShiftReportRepository shiftReportRepository;

    public ShiftSoldItemsReport load(CashierShift shift, Instant periodFrom, Instant reportAt) {
        List<Object[]> rows = shiftReportRepository.aggregateSoldItemsByShiftId(
            shift.getId(),
            periodFrom,
            reportAt
        );
        if (rows.isEmpty()) {
            rows = shiftReportRepository.aggregateSoldItemsByCashierAndTime(
                shift.getCashier().getId(),
                shift.getStore().getId(),
                periodFrom,
                reportAt
            );
        }
        return new ShiftSoldItemsReport(periodFrom, reportAt, ShiftSoldItemsRows.map(rows));
    }
}

package com.pos.reporting.service.impl;

import com.pos.reporting.service.CashierPerformanceService;

import com.pos.reporting.dto.CashierStatResponse;
import com.pos.reporting.repository.SaleFactRepository;
import com.pos.reporting.security.ReportingTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CashierPerformanceServiceImpl implements CashierPerformanceService {

    private final SaleFactRepository saleFactRepository;

    @Override
    public List<CashierStatResponse> performance(LocalDate from, LocalDate to) {
        Integer companyId = ReportingTenantContext.requireCompanyId();
        return saleFactRepository.cashierPerformance(companyId, from, to).stream()
            .map(row -> new CashierStatResponse(
                row[0] != null ? row[0].toString() : "",
                row[1] != null ? row[1].toString() : "",
                toLong(row[2]),
                toMoney(row[3])
            ))
            .toList();
    }

    private static long toLong(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number n) {
            return n.longValue();
        }
        return Long.parseLong(value.toString());
    }

    private static BigDecimal toMoney(Object value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        if (value instanceof BigDecimal bd) {
            return bd.setScale(2, RoundingMode.HALF_UP);
        }
        return new BigDecimal(value.toString()).setScale(2, RoundingMode.HALF_UP);
    }
}

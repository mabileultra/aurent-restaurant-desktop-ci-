package com.pos.reporting.service.impl;

import com.pos.reporting.service.CashierPerformanceService;

import com.pos.reporting.dto.CashierStatResponse;
import com.pos.reporting.repository.SaleFactRepository;
import com.pos.reporting.security.ReportingTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
                row[1] instanceof BigDecimal bd ? bd : new BigDecimal(row[1].toString())
            ))
            .toList();
    }
}

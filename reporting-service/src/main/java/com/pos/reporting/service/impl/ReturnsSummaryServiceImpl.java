package com.pos.reporting.service.impl;

import com.pos.reporting.dto.ReturnsSummaryResponse;
import com.pos.reporting.repository.SaleFactRepository;
import com.pos.reporting.security.ReportingTenantContext;
import com.pos.reporting.service.ReturnsSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReturnsSummaryServiceImpl implements ReturnsSummaryService {

    private final SaleFactRepository saleFactRepository;

    @Override
    public ReturnsSummaryResponse summary(LocalDate from, LocalDate to) {
        Integer companyId = ReportingTenantContext.requireCompanyId();
        Object[] row = saleFactRepository.aggregateReturns(companyId, from, to);
        long count = row != null && row.length > 0 && row[0] instanceof Number n ? n.longValue() : 0L;
        BigDecimal amount = row != null && row.length > 1 && row[1] instanceof BigDecimal b
            ? b
            : BigDecimal.ZERO;
        return new ReturnsSummaryResponse(count, amount);
    }
}

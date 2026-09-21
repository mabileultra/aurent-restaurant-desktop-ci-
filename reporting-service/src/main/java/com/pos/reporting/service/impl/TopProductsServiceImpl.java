package com.pos.reporting.service.impl;

import com.pos.reporting.service.TopProductsService;

import com.pos.reporting.dto.TopProductRowResponse;
import com.pos.reporting.repository.SaleItemFactRepository;
import com.pos.reporting.security.ReportingTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TopProductsServiceImpl implements TopProductsService {

    private final SaleItemFactRepository saleItemFactRepository;

    @Override
    public List<TopProductRowResponse> topProducts(int limit, LocalDate from, LocalDate to) {
        Integer companyId = ReportingTenantContext.requireCompanyId();
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.minus(30, ChronoUnit.DAYS);
        int cappedLimit = Math.max(1, Math.min(limit, 100));
        return saleItemFactRepository.topProducts(companyId, start, end, cappedLimit).stream()
            .map(row -> new TopProductRowResponse(
                row[0] != null ? row[0].toString() : "",
                toLong(row[1]),
                toMoney(row[2])
            ))
            .toList();
    }

    private static long toLong(Object value) {
        if (value == null) {
            return 0L;
        }
        return ((Number) value).longValue();
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

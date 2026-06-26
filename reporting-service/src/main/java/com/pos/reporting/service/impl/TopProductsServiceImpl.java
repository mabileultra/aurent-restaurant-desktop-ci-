package com.pos.reporting.service.impl;

import com.pos.reporting.service.TopProductsService;

import com.pos.reporting.dto.TopProductRowResponse;
import com.pos.reporting.repository.SaleItemFactRepository;
import com.pos.reporting.security.ReportingTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
                row[0].toString(),
                row[1] instanceof Number n ? n.longValue() : Long.parseLong(row[1].toString())
            ))
            .toList();
    }
}

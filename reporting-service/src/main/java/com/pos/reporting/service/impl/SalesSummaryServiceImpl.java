package com.pos.reporting.service.impl;

import com.pos.reporting.service.SalesSummaryService;

import com.pos.reporting.dto.SalesSummaryResponse;
import com.pos.reporting.repository.SaleFactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SalesSummaryServiceImpl implements SalesSummaryService {

    private final SaleFactRepository saleFactRepository;

    @Override
    public SalesSummaryResponse summary(Integer companyId, LocalDate from, LocalDate to) {
        BigDecimal total = saleFactRepository.sumTotalByCompanyAndDateRange(companyId, from, to);
        long count = saleFactRepository.countByCompanyIdAndTransactionDateBetween(companyId, from, to);
        return new SalesSummaryResponse(companyId, from.toString(), to.toString(), count, total);
    }
}

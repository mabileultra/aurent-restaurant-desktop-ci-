package com.pos.reporting.service.impl;

import com.pos.reporting.dto.shift.ShiftOverviewResponse;
import com.pos.reporting.dto.shift.ShiftReportRowResponse;
import com.pos.reporting.mapper.ShiftReportRowMapper;
import com.pos.reporting.repository.ShiftClosedFactsRepository;
import com.pos.reporting.security.ReportingTenantContext;
import com.pos.reporting.service.ShiftReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShiftReportServiceImpl implements ShiftReportService {

    private final ShiftClosedFactsRepository shiftClosedFactsRepository;
    private final ShiftReportRowMapper shiftReportRowMapper;

    @Override
    public ShiftOverviewResponse overview(LocalDate from, LocalDate to, int recentLimit) {
        Integer companyId = ReportingTenantContext.requireCompanyId();
        Object[] summary = shiftClosedFactsRepository.summarizePeriod(companyId, from, to);
        long periodCount = summary != null && summary.length > 0 && summary[0] instanceof Number n
            ? n.longValue() : 0L;
        BigDecimal periodTotal = summary != null && summary.length > 1 && summary[1] instanceof BigDecimal b
            ? b : BigDecimal.ZERO;
        long totalInSystem = shiftClosedFactsRepository.countByCompany(companyId);
        List<ShiftReportRowResponse> recent = shiftClosedFactsRepository.findRecent(companyId, recentLimit)
            .stream()
            .map(shiftReportRowMapper::toRow)
            .toList();
        return new ShiftOverviewResponse(periodCount, periodTotal, totalInSystem, recent);
    }
}

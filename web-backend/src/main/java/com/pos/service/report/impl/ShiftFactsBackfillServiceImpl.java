package com.pos.service.report.impl;

import com.pos.dto.shared.PageResponse;
import com.pos.sales.entity.CashierShift;
import com.pos.sales.repository.CashierShiftRepository;
import com.pos.service.event.support.DomainEventMappers;
import com.pos.service.report.ShiftFactsBackfillService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.event.ShiftClosedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShiftFactsBackfillServiceImpl implements ShiftFactsBackfillService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final CashierShiftRepository cashierShiftRepository;
    private final TenantAccessSupport tenantAccess;

    @Override
    public PageResponse<ShiftClosedEvent> page(LocalDate from, LocalDate to, int page, int size) {
        Instant start = from.atStartOfDay(ZONE).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZONE).toInstant();
        Integer companyId = tenantAccess.effectiveCompanyIdOrNull();
        int safeSize = Math.min(Math.max(size, 1), 500);
        Page<CashierShift> shifts = cashierShiftRepository.findClosedShiftsForReportingBackfill(
            start,
            end,
            companyId,
            PageRequest.of(Math.max(page, 0), safeSize)
        );
        List<ShiftClosedEvent> events = shifts.getContent().stream()
            .filter(shift -> shift.getZReport() != null)
            .map(shift -> DomainEventMappers.toShiftClosed(shift.getZReport(), shift))
            .filter(event -> event != null)
            .toList();
        return new PageResponse<>(
            events,
            shifts.getTotalPages(),
            shifts.getTotalElements(),
            shifts.getSize(),
            shifts.getNumber()
        );
    }
}

package com.pos.service.report.impl;

import com.pos.dto.shared.PageResponse;
import com.pos.entity.Sale;
import com.pos.repository.SaleRepository;
import com.pos.service.event.support.DomainEventMappers;
import com.pos.service.report.SaleFactsBackfillService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.event.SaleCompletedEvent;
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
public class SaleFactsBackfillServiceImpl implements SaleFactsBackfillService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final SaleRepository saleRepository;
    private final TenantAccessSupport tenantAccess;

    @Override
    public PageResponse<SaleCompletedEvent> page(LocalDate from, LocalDate to, int page, int size) {
        Instant start = from.atStartOfDay(ZONE).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZONE).toInstant();
        Integer companyId = tenantAccess.effectiveCompanyIdOrNull();
        int safeSize = Math.min(Math.max(size, 1), 500);
        Page<Sale> sales = saleRepository.findSalesForReportingBackfill(
            start,
            end,
            companyId,
            Sale.ReceiptType.SALE,
            PageRequest.of(Math.max(page, 0), safeSize)
        );
        List<SaleCompletedEvent> events = sales.getContent().stream()
            .map(DomainEventMappers::toSaleCompleted)
            .filter(event -> event != null)
            .toList();
        return new PageResponse<>(
            events,
            sales.getTotalPages(),
            sales.getTotalElements(),
            sales.getSize(),
            sales.getNumber()
        );
    }
}

package com.pos.service.report.impl;

import com.pos.dto.shared.PageResponse;
import com.pos.entity.StockReceipt;
import com.pos.repository.StockReceiptRepository;
import com.pos.service.event.support.DomainEventMappers;
import com.pos.service.report.StockFactsBackfillService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.event.StockReceivedEvent;
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
public class StockFactsBackfillServiceImpl implements StockFactsBackfillService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final StockReceiptRepository stockReceiptRepository;
    private final TenantAccessSupport tenantAccess;

    @Override
    public PageResponse<StockReceivedEvent> page(LocalDate from, LocalDate to, int page, int size) {
        Instant start = from.atStartOfDay(ZONE).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZONE).toInstant();
        Integer companyId = tenantAccess.effectiveCompanyIdOrNull();
        int safeSize = Math.min(Math.max(size, 1), 500);
        Page<StockReceipt> receipts = stockReceiptRepository.findForReportingBackfill(
            start,
            end,
            companyId,
            PageRequest.of(Math.max(page, 0), safeSize)
        );
        List<StockReceivedEvent> events = receipts.getContent().stream()
            .map(DomainEventMappers::toStockReceived)
            .filter(event -> event != null)
            .toList();
        return new PageResponse<>(
            events,
            receipts.getTotalPages(),
            receipts.getTotalElements(),
            receipts.getSize(),
            receipts.getNumber()
        );
    }
}

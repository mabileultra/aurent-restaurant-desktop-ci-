package com.pos.service.report.impl;

import com.pos.dto.shared.PageResponse;
import com.pos.inventory.entity.StockInventory;
import com.pos.inventory.repository.StockInventoryRepository;
import com.pos.service.event.support.DomainEventMappers;
import com.pos.service.report.InventoryFactsBackfillService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.event.StockInventoryRecordedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryFactsBackfillServiceImpl implements InventoryFactsBackfillService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final StockInventoryRepository stockInventoryRepository;
    private final TenantAccessSupport tenantAccess;

    @Override
    public PageResponse<StockInventoryRecordedEvent> page(LocalDate from, LocalDate to, int page, int size) {
        Instant start = from.atStartOfDay(ZONE).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZONE).toInstant();
        Integer companyId = tenantAccess.effectiveCompanyIdOrNull();
        int safeSize = Math.min(Math.max(size, 1), 500);
        Page<StockInventory> inventories = stockInventoryRepository.findByCompanyBetween(
            companyId,
            start,
            end,
            PageRequest.of(Math.max(page, 0), safeSize)
        );
        List<StockInventoryRecordedEvent> events = inventories.getContent().stream()
            .map(DomainEventMappers::toStockInventoryRecorded)
            .filter(Objects::nonNull)
            .toList();
        return new PageResponse<>(
            events,
            inventories.getTotalPages(),
            inventories.getTotalElements(),
            inventories.getSize(),
            inventories.getNumber()
        );
    }
}

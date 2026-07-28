package com.pos.service.report.impl;

import com.pos.dto.shared.PageResponse;
import com.pos.inventory.entity.StockMovement;
import com.pos.inventory.entity.StockReceipt;
import com.pos.inventory.repository.StockMovementRepository;
import com.pos.inventory.repository.StockReceiptRepository;
import com.pos.service.event.support.DomainEventMappers;
import com.pos.service.report.MovementFactsBackfillService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.event.StockMovementRecordedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MovementFactsBackfillServiceImpl implements MovementFactsBackfillService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final StockMovementRepository stockMovementRepository;
    private final StockReceiptRepository stockReceiptRepository;
    private final TenantAccessSupport tenantAccess;

    @Override
    public PageResponse<StockMovementRecordedEvent> page(LocalDate from, LocalDate to, int page, int size) {
        Instant start = from.atStartOfDay(ZONE).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZONE).toInstant();
        Integer companyId = tenantAccess.effectiveCompanyIdOrNull();
        int safeSize = Math.min(Math.max(size, 1), 500);
        Page<StockMovement> movements = stockMovementRepository.findForReportingBackfill(
            start,
            end,
            companyId,
            PageRequest.of(Math.max(page, 0), safeSize)
        );
        Map<UUID, String> receiptNumbers = loadReceiptNumbers(movements.getContent());
        List<StockMovementRecordedEvent> events = movements.getContent().stream()
            .map(movement -> DomainEventMappers.toStockMovementRecorded(
                movement,
                receiptNumbers.get(movement.getReferenceId())
            ))
            .filter(Objects::nonNull)
            .toList();
        return new PageResponse<>(
            events,
            movements.getTotalPages(),
            movements.getTotalElements(),
            movements.getSize(),
            movements.getNumber()
        );
    }

    private Map<UUID, String> loadReceiptNumbers(List<StockMovement> movements) {
        Set<UUID> ids = movements.stream()
            .map(StockMovement::getReferenceId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Map.of();
        }
        return stockReceiptRepository.findAllById(ids).stream()
            .collect(Collectors.toMap(StockReceipt::getId, StockReceipt::getReceiptNumber));
    }
}

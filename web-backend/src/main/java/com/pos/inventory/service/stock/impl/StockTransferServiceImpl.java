package com.pos.inventory.service.stock.impl;

import com.pos.dto.shared.PageResponse;
import com.pos.entity.User;
import com.pos.exception.PosExceptions;
import com.pos.inventory.domain.StockTransferStatus;
import com.pos.inventory.dto.warehouse.CreateStockTransferRequest;
import com.pos.inventory.dto.warehouse.StockTransferLineResponse;
import com.pos.inventory.dto.warehouse.StockTransferResponse;
import com.pos.inventory.dto.warehouse.UpdateStockTransferRequest;
import com.pos.inventory.entity.StockTransfer;
import com.pos.inventory.repository.StockTransferRepository;
import com.pos.inventory.service.stock.StockTransferService;
import com.pos.inventory.service.stock.support.StockDocumentSupport;
import com.pos.inventory.service.stock.support.StockTransferLineWriter;
import com.pos.inventory.service.stock.support.StockTransferPostSupport;
import com.pos.inventory.service.stock.support.StockTransferStoreGuard;
import com.pos.security.CurrentUserProvider;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class StockTransferServiceImpl implements StockTransferService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final StockTransferRepository stockTransferRepository;
    private final CurrentUserProvider currentUserProvider;
    private final TenantAccessSupport tenantAccess;
    private final StockDocumentSupport stockDocument;
    private final StockTransferStoreGuard storeGuard;
    private final StockTransferLineWriter lineWriter;
    private final StockTransferPostSupport postSupport;

    @Override
    public StockTransferResponse create(CreateStockTransferRequest request) {
        stockDocument.requireLines(request.lines());
        User user = currentUserProvider.requireCurrentUser();
        var stores = storeGuard.requireSameCompanyPair(request.fromStoreId(), request.toStoreId());

        StockTransfer transfer = stockTransferRepository.save(StockTransfer.builder()
            .transferNumber(nextTransferNumber())
            .status(StockTransferStatus.DRAFT)
            .fromStore(stores.fromStore())
            .toStore(stores.toStore())
            .notes(trimToNull(request.notes()))
            .createdBy(user)
            .totalQuantity(BigDecimal.ZERO)
            .build());
        lineWriter.replaceLines(transfer, request.lines());
        stockTransferRepository.save(transfer);

        boolean postNow = request.post() == null || Boolean.TRUE.equals(request.post());
        if (postNow) {
            postSupport.post(transfer, user);
            stockTransferRepository.save(transfer);
        }
        return toResponse(requireDetailed(transfer.getId()));
    }

    @Override
    public StockTransferResponse update(UUID id, UpdateStockTransferRequest request) {
        StockTransfer transfer = requireAccessible(id);
        requireDraft(transfer);
        stockDocument.requireLines(request.lines());
        var stores = storeGuard.requireSameCompanyPair(request.fromStoreId(), request.toStoreId());
        transfer.setFromStore(stores.fromStore());
        transfer.setToStore(stores.toStore());
        transfer.setNotes(trimToNull(request.notes()));
        lineWriter.replaceLines(transfer, request.lines());
        stockTransferRepository.save(transfer);
        return toResponse(requireDetailed(id));
    }

    @Override
    public StockTransferResponse post(UUID id) {
        StockTransfer transfer = requireAccessibleForUpdate(id);
        User user = currentUserProvider.requireCurrentUser();
        postSupport.post(transfer, user);
        stockTransferRepository.save(transfer);
        return toResponse(requireDetailed(id));
    }

    @Override
    @Transactional(readOnly = true)
    public StockTransferResponse getById(UUID id) {
        return toResponse(requireAccessible(id));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StockTransferResponse> list(
        LocalDate from,
        LocalDate to,
        Integer fromStoreId,
        Integer toStoreId,
        Pageable pageable
    ) {
        Instant start = from.atStartOfDay(ZONE).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZONE).toInstant();
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Page<StockTransfer> page = stockTransferRepository.findBetween(
            companyId, start, end, fromStoreId, toStoreId, pageable
        );
        return PageResponse.from(page.map(this::toSummary));
    }

    private StockTransfer requireAccessible(UUID id) {
        StockTransfer transfer = requireDetailed(id);
        tenantAccess.assertCanAccessStore(transfer.getFromStore());
        return transfer;
    }

    private StockTransfer requireAccessibleForUpdate(UUID id) {
        StockTransfer transfer = stockTransferRepository.findDetailedByIdForUpdate(id)
            .orElseThrow(() -> PosExceptions.notFound("Transfer"));
        tenantAccess.assertCanAccessStore(transfer.getFromStore());
        return transfer;
    }

    private StockTransfer requireDetailed(UUID id) {
        return stockTransferRepository.findDetailedById(id)
            .orElseThrow(() -> PosExceptions.notFound("Transfer"));
    }

    private void requireDraft(StockTransfer transfer) {
        if (!StockTransferStatus.DRAFT.equals(transfer.getStatus())) {
            throw PosExceptions.badRequest("Only DRAFT transfer can be updated");
        }
    }

    private String nextTransferNumber() {
        LocalDate today = LocalDate.now(ZONE);
        Instant dayStart = today.atStartOfDay(ZONE).toInstant();
        long seq = stockTransferRepository.countByCreatedAtGreaterThanEqual(dayStart) + 1;
        return "TRF-" + today.format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + String.format("%04d", seq);
    }

    private String trimToNull(String s) {
        if (!StringUtils.hasText(s)) {
            return null;
        }
        return s.trim();
    }

    private StockTransferResponse toSummary(StockTransfer t) {
        return new StockTransferResponse(
            t.getId(),
            t.getTransferNumber(),
            t.getStatus(),
            t.getFromStore().getId(),
            t.getFromStore().getName(),
            t.getToStore().getId(),
            t.getToStore().getName(),
            t.getNotes(),
            t.getTotalQuantity(),
            t.getCreatedBy() != null ? t.getCreatedBy().getFullName() : null,
            t.getCreatedAt(),
            List.of()
        );
    }

    private StockTransferResponse toResponse(StockTransfer t) {
        List<StockTransferLineResponse> lines = t.getLines().stream()
            .map(l -> new StockTransferLineResponse(
                l.getId(),
                l.getProductId(),
                l.getProductName(),
                l.getProductSku(),
                l.getQuantity()
            ))
            .toList();
        return new StockTransferResponse(
            t.getId(),
            t.getTransferNumber(),
            t.getStatus(),
            t.getFromStore().getId(),
            t.getFromStore().getName(),
            t.getToStore().getId(),
            t.getToStore().getName(),
            t.getNotes(),
            t.getTotalQuantity(),
            t.getCreatedBy() != null ? t.getCreatedBy().getFullName() : null,
            t.getCreatedAt(),
            lines
        );
    }
}

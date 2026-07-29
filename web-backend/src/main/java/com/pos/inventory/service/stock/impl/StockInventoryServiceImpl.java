package com.pos.inventory.service.stock.impl;

import com.pos.domain.StockMovementType;
import com.pos.dto.shared.PageResponse;
import com.pos.inventory.dto.warehouse.CreateStockInventoryRequest;
import com.pos.inventory.dto.warehouse.StockInventoryLineRequest;
import com.pos.inventory.dto.warehouse.StockInventoryLineResponse;
import com.pos.inventory.dto.warehouse.StockInventoryResponse;
import com.pos.catalog.entity.Product;
import com.pos.inventory.entity.StockInventory;
import com.pos.inventory.entity.StockInventoryLine;
import com.pos.inventory.entity.StockMovement;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.PosExceptions;
import com.pos.catalog.repository.ProductRepository;
import com.pos.inventory.repository.StockInventoryRepository;
import com.pos.repository.StoreRepository;
import com.pos.security.CurrentUserProvider;
import com.pos.inventory.service.stock.StockInventoryService;
import com.pos.service.event.PosDomainEventService;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.inventory.service.stock.support.StockDocumentSupport;
import com.pos.inventory.service.stock.support.StockMovementPersistence;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.pos.util.QuantityUtil;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class StockInventoryServiceImpl implements StockInventoryService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final StockInventoryRepository stockInventoryRepository;
    private final ProductRepository productRepository;
    private final StockMovementPersistence stockMovementPersistence;
    private final StoreRepository storeRepository;
    private final StoreStockService storeStockService;
    private final TenantAccessSupport tenantAccess;
    private final CurrentUserProvider currentUserProvider;
    private final StockDocumentSupport stockDocument;
    private final PosDomainEventService posDomainEventService;

    @Override
    public StockInventoryResponse create(CreateStockInventoryRequest request) {
        stockDocument.requireLines(request.lines());
        User user = currentUserProvider.requireCurrentUser();
        Integer companyId = tenantAccess.effectiveCompanyIdOrNull();
        stockDocument.requireCompanyContext(companyId);
        Store store = storeStockService.requireStoreForCompany(companyId, request.storeId());
        String number = nextInventoryNumber();
        StockInventory inventory = stockInventoryRepository.save(StockInventory.builder()
            .inventoryNumber(number)
            .store(store)
            .status("COMPLETED")
            .notes(trimToNull(request.notes()))
            .createdBy(user)
            .totalLines(0)
            .totalDifference(BigDecimal.ZERO)
            .build());
        UUID inventoryId = inventory.getId();

        int totalLines = 0;
        BigDecimal totalDiff = BigDecimal.ZERO;
        List<StockInventoryLine> lines = new ArrayList<>();

        for (StockInventoryLineRequest lineReq : request.lines()) {
            Product product = stockDocument.requireActiveProduct(lineReq.productId());
            BigDecimal systemQty = storeStockService.getQuantity(product.getId(), store.getId());
            BigDecimal counted = QuantityUtil.normalize(lineReq.countedQuantity());
            BigDecimal diff = QuantityUtil.subtract(counted, systemQty);
            lines.add(StockInventoryLine.builder()
                .inventory(inventory)
                .product(product)
                .systemQuantity(systemQty)
                .countedQuantity(counted)
                .difference(diff)
                .build());

            if (diff.signum() != 0) {
                storeStockService.setQuantity(product, store, counted);
                productRepository.save(product);
                stockMovementPersistence.save(StockMovement.builder()
                    .product(product)
                    .store(store)
                    .movementType(StockMovementType.ADJUSTMENT)
                    .quantity(diff)
                    .referenceId(inventoryId)
                    .notes("Инвентаризация " + number)
                    .createdBy(user)
                    .build());
            }
            totalLines++;
            totalDiff = totalDiff.add(diff.abs());
        }

        inventory.getLines().clear();
        inventory.getLines().addAll(lines);
        inventory.setTotalLines(totalLines);
        inventory.setTotalDifference(totalDiff);
        stockInventoryRepository.save(inventory);

        StockInventory detailed = stockInventoryRepository.findDetailedById(inventoryId).orElseThrow();
        posDomainEventService.publishStockInventoryAfterCommit(detailed);
        return toResponse(detailed);
    }

    @Override
    @Transactional(readOnly = true)
    public StockInventoryResponse getById(UUID id) {
        StockInventory inventory = stockInventoryRepository.findDetailedById(id)
            .orElseThrow(() -> PosExceptions.notFound("Inventory"));
        if (inventory.getStore() != null) {
            tenantAccess.assertCanAccessStore(inventory.getStore());
        }
        return toResponse(inventory);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StockInventoryResponse> list(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Pageable pageable
    ) {
        Instant start = from.atStartOfDay(ZONE).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZONE).toInstant();
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Page<StockInventory> page = stockInventoryRepository.findBetween(
            companyId, start, end, storeId, pageable
        );
        return PageResponse.from(page.map(this::toSummary));
    }

    private String nextInventoryNumber() {
        LocalDate today = LocalDate.now(ZONE);
        Instant dayStart = today.atStartOfDay(ZONE).toInstant();
        long seq = stockInventoryRepository.countByCreatedAtGreaterThanEqual(dayStart) + 1;
        return "INV-" + today.format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + String.format("%04d", seq);
    }

    private Store resolveStore(Integer storeId) {
        if (storeId == null) {
            return null;
        }
        return storeRepository.findById(storeId)
            .orElseThrow(() -> PosExceptions.notFound("Store"));
    }

    private String trimToNull(String s) {
        if (!StringUtils.hasText(s)) {
            return null;
        }
        return s.trim();
    }

    private StockInventoryResponse toSummary(StockInventory i) {
        return new StockInventoryResponse(
            i.getId(),
            i.getInventoryNumber(),
            i.getStore() != null ? i.getStore().getId() : null,
            i.getStore() != null ? i.getStore().getName() : null,
            i.getStatus(),
            i.getNotes(),
            i.getTotalLines(),
            i.getTotalDifference(),
            i.getCreatedBy() != null ? i.getCreatedBy().getFullName() : null,
            i.getCreatedAt(),
            List.of()
        );
    }

    private StockInventoryResponse toResponse(StockInventory i) {
        List<StockInventoryLineResponse> lines = i.getLines().stream()
            .map(l -> new StockInventoryLineResponse(
                l.getId(),
                l.getProduct().getId(),
                l.getProduct().getName(),
                l.getProduct().getSku(),
                l.getSystemQuantity(),
                l.getCountedQuantity(),
                l.getDifference()
            ))
            .toList();
        return new StockInventoryResponse(
            i.getId(),
            i.getInventoryNumber(),
            i.getStore() != null ? i.getStore().getId() : null,
            i.getStore() != null ? i.getStore().getName() : null,
            i.getStatus(),
            i.getNotes(),
            i.getTotalLines(),
            i.getTotalDifference(),
            i.getCreatedBy() != null ? i.getCreatedBy().getFullName() : null,
            i.getCreatedAt(),
            lines
        );
    }
}

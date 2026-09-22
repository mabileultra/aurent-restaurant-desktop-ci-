package com.pos.inventory.service.stock.impl;

import com.pos.domain.StockMovementType;
import com.pos.dto.shared.PageResponse;
import com.pos.catalog.entity.Product;
import com.pos.catalog.repository.ProductRepository;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.PosExceptions;
import com.pos.inventory.dto.warehouse.CreateStockProductionRequest;
import com.pos.inventory.dto.warehouse.StockProductionLineRequest;
import com.pos.inventory.dto.warehouse.StockProductionLineResponse;
import com.pos.inventory.dto.warehouse.StockProductionResponse;
import com.pos.inventory.entity.StockMovement;
import com.pos.inventory.entity.StockProduction;
import com.pos.inventory.entity.StockProductionLine;
import com.pos.inventory.repository.StockProductionRepository;
import com.pos.inventory.service.stock.StockProductionService;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.inventory.service.stock.support.StockDocumentSupport;
import com.pos.inventory.service.stock.support.StockMovementPersistence;
import com.pos.security.CurrentUserProvider;
import com.pos.service.support.CatalogIsolationSupport;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.QuantityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
public class StockProductionServiceImpl implements StockProductionService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final StockProductionRepository stockProductionRepository;
    private final ProductRepository productRepository;
    private final StockMovementPersistence stockMovementPersistence;
    private final StoreStockService storeStockService;
    private final CurrentUserProvider currentUserProvider;
    private final TenantAccessSupport tenantAccess;
    private final StockDocumentSupport stockDocument;
    private final CatalogIsolationSupport catalogIsolation;

    @Override
    public StockProductionResponse create(CreateStockProductionRequest request) {
        stockDocument.requireLines(request.lines());
        User user = currentUserProvider.requireCurrentUser();
        Integer companyId = tenantAccess.effectiveCompanyIdOrNull();
        stockDocument.requireCompanyContext(companyId);
        Store store = storeStockService.requireStoreForCompany(companyId, request.storeId());
        catalogIsolation.rejectPharmacyStoreOnGrocery(store);

        Product output = stockDocument.requireActiveGroceryProduct(request.outputProductId());
        BigDecimal outputQty = QuantityUtil.normalize(request.outputQuantity());
        stockDocument.requirePositiveQuantity(outputQty);
        com.pos.util.QuantityValidator.validate(output, outputQty);

        if (request.lines().stream().anyMatch(l -> l.productId().equals(output.getId()))) {
            throw PosExceptions.badRequest("Output product cannot be in input lines");
        }

        String number = nextProductionNumber();
        StockProduction production = stockProductionRepository.save(StockProduction.builder()
            .productionNumber(number)
            .store(store)
            .outputProduct(output)
            .outputQuantity(outputQty)
            .outputUnitCost(BigDecimal.ZERO)
            .notes(trimToNull(request.notes()))
            .createdBy(user)
            .totalInputQuantity(BigDecimal.ZERO)
            .totalInputCost(BigDecimal.ZERO)
            .build());
        UUID productionId = production.getId();

        BigDecimal totalInputQty = BigDecimal.ZERO;
        BigDecimal totalInputCost = BigDecimal.ZERO;
        List<StockProductionLine> lines = new ArrayList<>();

        for (StockProductionLineRequest lineReq : request.lines()) {
            Product product = stockDocument.requireActiveGroceryProduct(lineReq.productId());
            BigDecimal q = QuantityUtil.normalize(lineReq.quantity());
            stockDocument.requirePositiveQuantity(q);
            com.pos.util.QuantityValidator.validate(product, q);
            storeStockService.requireAvailable(product, store, q);
            storeStockService.decrease(product, store, q);
            productRepository.save(product);

            BigDecimal unitCost = product.getCostPrice() != null
                ? product.getCostPrice()
                : BigDecimal.ZERO;
            BigDecimal lineCost = unitCost.multiply(q).setScale(2, RoundingMode.HALF_UP);

            lines.add(StockProductionLine.builder()
                .production(production)
                .product(product)
                .quantity(q)
                .unitCost(unitCost)
                .lineCost(lineCost)
                .build());

            stockMovementPersistence.save(StockMovement.builder()
                .product(product)
                .store(store)
                .movementType(StockMovementType.PRODUCTION_CONSUMPTION)
                .quantity(q.negate())
                .referenceId(productionId)
                .notes("Производство " + number + " · расход")
                .createdBy(user)
                .build(), number);

            totalInputQty = QuantityUtil.add(totalInputQty, q);
            totalInputCost = totalInputCost.add(lineCost);
        }

        BigDecimal unitCost = totalInputCost.signum() > 0
            ? totalInputCost.divide(outputQty, 2, RoundingMode.HALF_UP)
            : (request.outputUnitCost() != null
                ? request.outputUnitCost().setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));

        applyWeightedAverageCost(output, store, outputQty, unitCost);
        storeStockService.increase(output, store, outputQty);
        productRepository.save(output);

        stockMovementPersistence.save(StockMovement.builder()
            .product(output)
            .store(store)
            .movementType(StockMovementType.PRODUCTION_OUTPUT)
            .quantity(outputQty)
            .referenceId(productionId)
            .notes("Производство " + number + " · выход")
            .createdBy(user)
            .build(), number);

        production.getLines().clear();
        production.getLines().addAll(lines);
        production.setTotalInputQuantity(totalInputQty);
        production.setTotalInputCost(totalInputCost);
        production.setOutputUnitCost(unitCost);
        stockProductionRepository.save(production);

        return toResponse(stockProductionRepository.findDetailedById(productionId).orElseThrow());
    }

    private void applyWeightedAverageCost(Product product, Store store, BigDecimal incomingQty, BigDecimal incomingUnitCost) {
        BigDecimal before = storeStockService.getQuantity(product.getId(), store.getId());
        BigDecimal oldCost = product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO;
        BigDecimal after = QuantityUtil.add(before, incomingQty);
        if (after.signum() <= 0) {
            product.setCostPrice(incomingUnitCost);
            return;
        }
        BigDecimal totalValue = before.multiply(oldCost).add(incomingQty.multiply(incomingUnitCost));
        product.setCostPrice(totalValue.divide(after, 2, RoundingMode.HALF_UP));
    }

    @Override
    @Transactional(readOnly = true)
    public StockProductionResponse getById(UUID id) {
        StockProduction production = stockProductionRepository.findDetailedById(id)
            .orElseThrow(() -> PosExceptions.notFound("Production"));
        tenantAccess.assertCanAccessStore(production.getStore());
        return toResponse(production);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StockProductionResponse> list(LocalDate from, LocalDate to, Integer storeId, Pageable pageable) {
        Instant start = from.atStartOfDay(ZONE).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZONE).toInstant();
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Page<StockProduction> page = stockProductionRepository.findBetween(companyId, start, end, storeId, pageable);
        return PageResponse.from(page.map(this::toSummary));
    }

    private String nextProductionNumber() {
        LocalDate today = LocalDate.now(ZONE);
        Instant dayStart = today.atStartOfDay(ZONE).toInstant();
        long seq = stockProductionRepository.countByCreatedAtGreaterThanEqual(dayStart) + 1;
        return "PRD-" + today.format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + String.format("%04d", seq);
    }

    private String trimToNull(String s) {
        if (!StringUtils.hasText(s)) {
            return null;
        }
        return s.trim();
    }

    private StockProductionResponse toSummary(StockProduction p) {
        return new StockProductionResponse(
            p.getId(),
            p.getProductionNumber(),
            p.getStore().getId(),
            p.getStore().getName(),
            p.getOutputProduct().getId(),
            p.getOutputProduct().getName(),
            p.getOutputQuantity(),
            p.getOutputUnitCost(),
            p.getNotes(),
            p.getTotalInputQuantity(),
            p.getTotalInputCost(),
            p.getCreatedBy() != null ? p.getCreatedBy().getFullName() : null,
            p.getCreatedAt(),
            List.of()
        );
    }

    private StockProductionResponse toResponse(StockProduction p) {
        List<StockProductionLineResponse> lines = p.getLines().stream()
            .map(l -> new StockProductionLineResponse(
                l.getId(),
                l.getProduct().getId(),
                l.getProduct().getName(),
                l.getProduct().getSku(),
                l.getQuantity(),
                l.getUnitCost(),
                l.getLineCost()
            ))
            .toList();
        return new StockProductionResponse(
            p.getId(),
            p.getProductionNumber(),
            p.getStore().getId(),
            p.getStore().getName(),
            p.getOutputProduct().getId(),
            p.getOutputProduct().getName(),
            p.getOutputQuantity(),
            p.getOutputUnitCost(),
            p.getNotes(),
            p.getTotalInputQuantity(),
            p.getTotalInputCost(),
            p.getCreatedBy() != null ? p.getCreatedBy().getFullName() : null,
            p.getCreatedAt(),
            lines
        );
    }
}

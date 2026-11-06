package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.cache.PharmacyCatalogCacheEvictor;
import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.service.ProductCatalogService;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyInventoryErrors;
import com.pos.pharmacy.util.QuantityUtil;
import com.pos.pharmacy.warehouse.dto.CreatePharmacyInventoryRequest;
import com.pos.pharmacy.warehouse.dto.PharmacyInventoryLineRequest;
import com.pos.pharmacy.warehouse.entity.StockInventory;
import com.pos.pharmacy.warehouse.entity.StockInventoryLine;
import com.pos.pharmacy.warehouse.entity.StockMovement;
import com.pos.pharmacy.warehouse.repository.StockInventoryRepository;
import com.pos.pharmacy.warehouse.repository.StockMovementRepository;
import com.pos.pharmacy.warehouse.service.StoreStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Проведение инвентаризации: store_stock + lots + stock_movements (ADJUSTMENT). */
@Component
@RequiredArgsConstructor
public class PharmacyInventoryWriter {

    private final ProductCatalogService productCatalogService;
    private final StoreStockService storeStockService;
    private final PharmacyReceiptStockIncrease stockIncrease;
    private final PharmacyReceiptStockReversal stockReversal;
    private final PharmacyInventoryLotAdjuster lotAdjuster;
    private final PharmacyInventoryNumberAllocator numberAllocator;
    private final StockInventoryRepository stockInventoryRepository;
    private final StockMovementRepository stockMovementRepository;
    private final PharmacyCatalogCacheEvictor catalogCacheEvictor;

    @Transactional
    public StockInventory create(Integer companyId, UUID userId, CreatePharmacyInventoryRequest request) {
        if (request.storeId() == null) {
            throw PharmacyErrors.of(PharmacyInventoryErrors.PHARM_INVENTORY_STORE_REQUIRED);
        }
        if (request.lines() == null || request.lines().isEmpty()) {
            throw PharmacyErrors.of(PharmacyInventoryErrors.PHARM_INVENTORY_NEED_LINES);
        }

        Integer storeId = request.storeId();
        String number = numberAllocator.next();
        StockInventory inventory = stockInventoryRepository.save(StockInventory.builder()
            .companyId(companyId)
            .inventoryNumber(number)
            .storeId(storeId)
            .notes(blankToNull(request.notes()))
            .createdBy(userId)
            .build());

        Map<UUID, BigDecimal> countedByProduct = new LinkedHashMap<>();
        for (PharmacyInventoryLineRequest lineReq : request.lines()) {
            BigDecimal counted = QuantityUtil.normalize(lineReq.countedQuantity());
            if (counted.signum() < 0) {
                throw PharmacyErrors.of(PharmacyInventoryErrors.PHARM_INVENTORY_COUNTED_NEGATIVE);
            }
            countedByProduct.merge(lineReq.productId(), counted, QuantityUtil::add);
        }

        Map<UUID, Product> products = new HashMap<>();
        Map<UUID, BigDecimal> increases = new LinkedHashMap<>();
        Map<UUID, BigDecimal> decreases = new LinkedHashMap<>();
        Map<UUID, BigDecimal> signedDiff = new LinkedHashMap<>();
        List<StockInventoryLine> lines = new ArrayList<>();
        BigDecimal totalDiffAbs = BigDecimal.ZERO;

        for (Map.Entry<UUID, BigDecimal> entry : countedByProduct.entrySet()) {
            Product product = productCatalogService.requireActive(entry.getKey());
            products.put(product.getId(), product);
            BigDecimal systemQty = storeStockService.getQuantity(product.getId(), storeId);
            BigDecimal counted = entry.getValue();
            BigDecimal diff = QuantityUtil.subtract(counted, systemQty);
            lines.add(StockInventoryLine.builder()
                .inventory(inventory)
                .productId(product.getId())
                .productName(product.getName())
                .productSku(product.getSku())
                .systemQuantity(systemQty)
                .countedQuantity(counted)
                .difference(diff)
                .build());
            if (diff.signum() > 0) {
                increases.put(product.getId(), diff);
                signedDiff.put(product.getId(), diff);
            } else if (diff.signum() < 0) {
                decreases.put(product.getId(), diff.abs());
                signedDiff.put(product.getId(), diff);
            }
            totalDiffAbs = QuantityUtil.add(totalDiffAbs, diff.abs());
        }

        if (!increases.isEmpty()) {
            stockIncrease.increase(storeId, products, increases);
        }
        if (!decreases.isEmpty()) {
            stockReversal.reverse(storeId, products, decreases);
        }

        List<StockMovement> movements = lotAdjuster.apply(
            companyId, storeId, inventory.getId(), userId, number, products, signedDiff
        );
        if (!movements.isEmpty()) {
            stockMovementRepository.saveAll(movements);
        }

        inventory.getLines().clear();
        inventory.getLines().addAll(lines);
        inventory.setTotalLines(lines.size());
        inventory.setTotalDifference(totalDiffAbs);
        StockInventory saved = stockInventoryRepository.save(inventory);
        catalogCacheEvictor.onStoreStockChanged(companyId, storeId);
        return saved;
    }

    private static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}

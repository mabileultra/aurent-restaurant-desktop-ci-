package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacySaleErrors;
import com.pos.pharmacy.util.QuantityUtil;
import com.pos.pharmacy.warehouse.domain.PharmacyStockMovementType;
import com.pos.pharmacy.warehouse.entity.StockLot;
import com.pos.pharmacy.warehouse.entity.StockMovement;
import com.pos.pharmacy.warehouse.repository.StockLotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** ADJUSTMENT по партиям: surplus → lot; shortage → FEFO (или legacy без lot). */
@Component
@RequiredArgsConstructor
public class PharmacyInventoryLotAdjuster {

    private final StockLotRepository stockLotRepository;

    public List<StockMovement> apply(
        Integer companyId,
        Integer storeId,
        UUID inventoryId,
        UUID userId,
        String inventoryNumber,
        Map<UUID, Product> products,
        Map<UUID, BigDecimal> signedDiffByProduct
    ) {
        List<StockMovement> movements = new ArrayList<>();
        List<StockLot> dirty = new ArrayList<>();

        for (Map.Entry<UUID, BigDecimal> entry : signedDiffByProduct.entrySet()) {
            BigDecimal diff = QuantityUtil.normalize(entry.getValue());
            if (diff.signum() == 0) {
                continue;
            }
            UUID productId = entry.getKey();
            Product product = products.get(productId);
            if (diff.signum() > 0) {
                StockLot lot = increase(storeId, product, diff, dirty);
                movements.add(movement(
                    companyId, storeId, productId, lot.getId(), diff, inventoryId, userId, inventoryNumber
                ));
            } else {
                decreaseFefo(
                    companyId, storeId, productId, product, diff.abs(),
                    inventoryId, userId, inventoryNumber, dirty, movements
                );
            }
        }
        if (!dirty.isEmpty()) {
            stockLotRepository.saveAll(dirty);
        }
        return movements;
    }

    private StockLot increase(Integer storeId, Product product, BigDecimal qty, List<StockLot> dirty) {
        List<StockLot> lots = stockLotRepository.findAvailableFefo(product.getId(), storeId);
        if (!lots.isEmpty()) {
            StockLot lot = lots.get(0);
            lot.setQuantity(QuantityUtil.add(lot.getQuantity(), qty));
            dirty.add(lot);
            return lot;
        }
        return stockLotRepository.save(StockLot.builder()
            .product(product)
            .storeId(storeId)
            .quantity(qty)
            .purchasePrice(product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO)
            .unitSellingPrice(product.getSellingPrice() != null ? product.getSellingPrice() : BigDecimal.ZERO)
            .build());
    }

    private void decreaseFefo(
        Integer companyId,
        Integer storeId,
        UUID productId,
        Product product,
        BigDecimal need,
        UUID inventoryId,
        UUID userId,
        String inventoryNumber,
        List<StockLot> dirty,
        List<StockMovement> movements
    ) {
        List<StockLot> lots = stockLotRepository.findAvailableFefo(productId, storeId);
        if (lots.isEmpty()) {
            movements.add(movement(
                companyId, storeId, productId, null, need.negate(), inventoryId, userId, inventoryNumber
            ));
            return;
        }
        BigDecimal remaining = need;
        for (StockLot lot : lots) {
            if (remaining.signum() <= 0) {
                break;
            }
            BigDecimal available = QuantityUtil.normalize(lot.getQuantity());
            BigDecimal take = available.compareTo(remaining) <= 0 ? available : remaining;
            if (take.signum() <= 0) {
                continue;
            }
            lot.setQuantity(QuantityUtil.subtract(lot.getQuantity(), take));
            dirty.add(lot);
            remaining = QuantityUtil.subtract(remaining, take);
            movements.add(movement(
                companyId, storeId, productId, lot.getId(), take.negate(), inventoryId, userId, inventoryNumber
            ));
        }
        if (remaining.signum() > 0) {
            String name = product != null && product.getName() != null
                ? product.getName()
                : String.valueOf(productId);
            throw PharmacyErrors.of(
                PharmacySaleErrors.PHARM_STOCK_INSUFFICIENT,
                "Недостаточно партий для «" + name + "». Не хватает: " + remaining
            );
        }
    }

    private static StockMovement movement(
        Integer companyId,
        Integer storeId,
        UUID productId,
        UUID lotId,
        BigDecimal qty,
        UUID inventoryId,
        UUID userId,
        String inventoryNumber
    ) {
        return StockMovement.builder()
            .companyId(companyId)
            .storeId(storeId)
            .productId(productId)
            .lotId(lotId)
            .movementType(PharmacyStockMovementType.ADJUSTMENT)
            .quantity(qty)
            .referenceType(PharmacyStockMovementType.REF_INVENTORY)
            .referenceId(inventoryId)
            .notes("Инвентаризация " + inventoryNumber)
            .createdBy(userId)
            .build();
    }
}

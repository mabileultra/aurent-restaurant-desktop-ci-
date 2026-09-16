package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.sales.entity.SaleItem;
import com.pos.pharmacy.sales.entity.SaleItemLot;
import com.pos.pharmacy.util.QuantityUtil;
import com.pos.pharmacy.warehouse.entity.StockLot;
import com.pos.pharmacy.warehouse.repository.StockLotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PharmacyLotFefoSupport {

    private final StockLotRepository stockLotRepository;

    public boolean decreaseForSale(Product product, Integer storeId, BigDecimal quantity, SaleItem saleItem) {
        if (product == null || storeId == null || quantity == null || saleItem == null) {
            return false;
        }
        BigDecimal need = QuantityUtil.normalize(quantity);
        if (need.compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }
        if (!stockLotRepository.existsByProduct_IdAndStoreIdAndQuantityGreaterThan(
            product.getId(), storeId, BigDecimal.ZERO
        )) {
            return false;
        }

        List<StockLot> lots = stockLotRepository.findAvailableFefo(product.getId(), storeId);
        BigDecimal remaining = need;
        List<SaleItemLot> allocations = new ArrayList<>();

        for (StockLot lot : lots) {
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }
            BigDecimal available = QuantityUtil.normalize(lot.getQuantity());
            if (available.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            BigDecimal take = available.min(remaining);
            lot.setQuantity(QuantityUtil.normalize(available.subtract(take)));
            stockLotRepository.save(lot);

            allocations.add(SaleItemLot.builder()
                .saleItem(saleItem)
                .lot(lot)
                .quantity(take)
                .batchNumber(lot.getBatchNumber())
                .expiryDate(lot.getExpiryDate())
                .build());
            remaining = QuantityUtil.normalize(remaining.subtract(take));
        }

        if (remaining.compareTo(BigDecimal.ZERO) > 0) {
            throw PharmacyErrors.badRequest(
                "Недостаточно партий (серия/срок) для «" + product.getName() + "». Нужно ещё " + remaining
            );
        }

        if (!allocations.isEmpty()) {
            SaleItemLot first = allocations.get(0);
            saleItem.setBatchNumber(first.getBatchNumber());
            saleItem.setExpiryDate(first.getExpiryDate());
            if (saleItem.getLotAllocations() == null) {
                saleItem.setLotAllocations(new ArrayList<>());
            }
            saleItem.getLotAllocations().clear();
            saleItem.getLotAllocations().addAll(allocations);
        }
        return true;
    }

    public void restorePartial(SaleItem saleItem, BigDecimal returnQty) {
        if (saleItem == null || returnQty == null || returnQty.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        if (saleItem.getLotAllocations() == null || saleItem.getLotAllocations().isEmpty()) {
            return;
        }
        BigDecimal remaining = QuantityUtil.normalize(returnQty);
        List<SaleItemLot> reverse = new ArrayList<>(saleItem.getLotAllocations());
        java.util.Collections.reverse(reverse);
        for (SaleItemLot allocation : reverse) {
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }
            StockLot lot = allocation.getLot();
            if (lot == null) {
                continue;
            }
            BigDecimal allocQty = QuantityUtil.normalize(allocation.getQuantity());
            BigDecimal give = allocQty.min(remaining);
            lot.setQuantity(QuantityUtil.add(lot.getQuantity(), give));
            stockLotRepository.save(lot);
            remaining = QuantityUtil.normalize(remaining.subtract(give));
        }
    }

    public record FefoHint(
        UUID productId,
        String batchNumber,
        LocalDate expiryDate,
        BigDecimal lotQuantity
    ) {}

    public List<FefoHint> fefoHints(Integer storeId, Collection<UUID> productIds) {
        if (storeId == null || productIds == null || productIds.isEmpty()) {
            return List.of();
        }
        List<StockLot> lots = stockLotRepository.findAvailableForProducts(storeId, productIds);
        Map<UUID, FefoHint> firstByProduct = new LinkedHashMap<>();
        Map<UUID, BigDecimal> totals = new LinkedHashMap<>();
        for (StockLot lot : lots) {
            UUID pid = lot.getProduct().getId();
            totals.merge(pid, QuantityUtil.normalize(lot.getQuantity()), QuantityUtil::add);
            firstByProduct.computeIfAbsent(pid, id -> new FefoHint(
                id,
                lot.getBatchNumber(),
                lot.getExpiryDate(),
                BigDecimal.ZERO
            ));
        }
        List<FefoHint> result = new ArrayList<>();
        for (Map.Entry<UUID, FefoHint> e : firstByProduct.entrySet()) {
            FefoHint h = e.getValue();
            result.add(new FefoHint(
                h.productId(),
                h.batchNumber(),
                h.expiryDate(),
                totals.getOrDefault(e.getKey(), BigDecimal.ZERO)
            ));
        }
        return result;
    }

    public List<StockLot> listAvailable(UUID productId, Integer storeId) {
        return stockLotRepository.findAvailableFefo(productId, storeId);
    }
}

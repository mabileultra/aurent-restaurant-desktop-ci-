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
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PharmacyLotFefoSupport {

    private final StockLotRepository stockLotRepository;

    public record SaleLotNeed(Product product, BigDecimal quantity, SaleItem saleItem) {}

    public boolean decreaseForSale(Product product, Integer storeId, BigDecimal quantity, SaleItem saleItem) {
        decreaseForSaleBatch(storeId, List.of(new SaleLotNeed(product, quantity, saleItem)));
        return true;
    }

    /**
     * One DB load of FEFO lots for all products, then in-memory allocation + single saveAll.
     * Products without lot rows are skipped (legacy stock-only paths).
     */
    public void decreaseForSaleBatch(Integer storeId, List<SaleLotNeed> needs) {
        if (storeId == null || needs == null || needs.isEmpty()) {
            return;
        }
        Set<UUID> productIds = new HashSet<>();
        for (SaleLotNeed need : needs) {
            if (need != null && need.product() != null) {
                productIds.add(need.product().getId());
            }
        }
        if (productIds.isEmpty()) {
            return;
        }

        List<StockLot> loaded = stockLotRepository.findAvailableForProducts(storeId, productIds);
        Map<UUID, List<StockLot>> lotsByProduct = new LinkedHashMap<>();
        for (StockLot lot : loaded) {
            lotsByProduct.computeIfAbsent(lot.getProduct().getId(), id -> new ArrayList<>()).add(lot);
        }

        List<StockLot> dirty = new ArrayList<>();
        for (SaleLotNeed need : needs) {
            if (need == null || need.product() == null || need.saleItem() == null || need.quantity() == null) {
                continue;
            }
            BigDecimal remaining = QuantityUtil.normalize(need.quantity());
            if (remaining.signum() <= 0) {
                continue;
            }
            List<StockLot> lots = lotsByProduct.get(need.product().getId());
            if (lots == null || lots.isEmpty()) {
                continue;
            }

            List<SaleItemLot> allocations = new ArrayList<>();
            for (StockLot lot : lots) {
                if (remaining.signum() <= 0) {
                    break;
                }
                BigDecimal available = QuantityUtil.normalize(lot.getQuantity());
                if (available.signum() <= 0) {
                    continue;
                }
                BigDecimal take = available.min(remaining);
                lot.setQuantity(QuantityUtil.normalize(available.subtract(take)));
                dirty.add(lot);

                allocations.add(SaleItemLot.builder()
                    .saleItem(need.saleItem())
                    .lot(lot)
                    .quantity(take)
                    .batchNumber(lot.getBatchNumber())
                    .expiryDate(lot.getExpiryDate())
                    .build());
                remaining = QuantityUtil.normalize(remaining.subtract(take));
            }

            if (remaining.signum() > 0) {
                throw PharmacyErrors.badRequest(
                    "Недостаточно партий (серия/срок) для «" + need.product().getName() + "». Нужно ещё " + remaining
                );
            }

            if (!allocations.isEmpty()) {
                SaleItemLot first = allocations.get(0);
                need.saleItem().setBatchNumber(first.getBatchNumber());
                need.saleItem().setExpiryDate(first.getExpiryDate());
                if (need.saleItem().getLotAllocations() == null) {
                    need.saleItem().setLotAllocations(new ArrayList<>());
                }
                need.saleItem().getLotAllocations().clear();
                need.saleItem().getLotAllocations().addAll(allocations);
            }
        }

        if (!dirty.isEmpty()) {
            stockLotRepository.saveAll(dirty);
        }
    }

    public void restorePartial(SaleItem saleItem, BigDecimal returnQty) {
        if (saleItem == null || returnQty == null || returnQty.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        if (saleItem.getLotAllocations() == null || saleItem.getLotAllocations().isEmpty()) {
            return;
        }
        List<SaleItemLot> allocations = saleItem.getLotAllocations();
        List<BigDecimal> quantities = new ArrayList<>();
        for (SaleItemLot allocation : allocations) {
            quantities.add(QuantityUtil.normalize(allocation.getQuantity()));
        }
        for (LotReturnAllocation.Restore step : LotReturnAllocation.plan(quantities, QuantityUtil.normalize(returnQty))) {
            SaleItemLot allocation = allocations.get(step.indexFromEnd());
            StockLot lot = allocation.getLot();
            if (lot != null && step.giveBack().signum() > 0) {
                lot.setQuantity(QuantityUtil.add(lot.getQuantity(), step.giveBack()));
                stockLotRepository.save(lot);
            }
            allocation.setQuantity(step.remainingAllocation());
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

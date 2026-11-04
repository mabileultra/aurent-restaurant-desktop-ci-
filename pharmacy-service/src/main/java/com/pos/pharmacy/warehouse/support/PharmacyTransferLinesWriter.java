package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.service.ProductCatalogService;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacySaleErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyTransferErrors;
import com.pos.pharmacy.util.QuantityUtil;
import com.pos.pharmacy.warehouse.dto.CreatePharmacyTransferRequest;
import com.pos.pharmacy.warehouse.dto.PharmacyTransferLineRequest;
import com.pos.pharmacy.warehouse.entity.StockLot;
import com.pos.pharmacy.warehouse.entity.StockTransfer;
import com.pos.pharmacy.warehouse.entity.StockTransferLine;
import com.pos.pharmacy.warehouse.repository.StockLotRepository;
import com.pos.pharmacy.warehouse.repository.StockTransferRepository;
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

/** Перемещение выбранных товаров (FEFO по партиям + store_stock). */
@Component
@RequiredArgsConstructor
public class PharmacyTransferLinesWriter {

    private final ProductCatalogService productCatalogService;
    private final StoreStockService storeStockService;
    private final PharmacyReceiptStockIncrease stockIncrease;
    private final StockLotRepository stockLotRepository;
    private final StockTransferRepository stockTransferRepository;
    private final PharmacyTransferNumberAllocator numberAllocator;

    @Transactional
    public StockTransfer create(Integer companyId, UUID userId, CreatePharmacyTransferRequest request) {
        if (request.fromStoreId().equals(request.toStoreId())) {
            throw PharmacyErrors.of(PharmacyTransferErrors.PHARM_TRANSFER_SAME_STORE);
        }
        Map<UUID, BigDecimal> qtyByProduct = aggregate(request.lines());
        if (qtyByProduct.isEmpty()) {
            throw PharmacyErrors.of(PharmacyTransferErrors.PHARM_TRANSFER_NEED_LINES);
        }

        Map<UUID, Product> products = new HashMap<>();
        Map<UUID, String> names = new HashMap<>();
        Map<UUID, String> skus = new HashMap<>();
        for (UUID productId : qtyByProduct.keySet()) {
            Product product = productCatalogService.requireActive(productId);
            products.put(productId, product);
            names.put(productId, product.getName());
            skus.put(productId, product.getSku());
        }

        Integer fromStoreId = request.fromStoreId();
        Integer toStoreId = request.toStoreId();
        storeStockService.decreaseAll(fromStoreId, products, qtyByProduct);
        stockIncrease.increase(toStoreId, products, qtyByProduct);
        moveLotsFefo(fromStoreId, toStoreId, products, qtyByProduct);

        BigDecimal totalQty = qtyByProduct.values().stream()
            .reduce(BigDecimal.ZERO, QuantityUtil::add);

        StockTransfer transfer = StockTransfer.builder()
            .companyId(companyId)
            .transferNumber(numberAllocator.next())
            .fromStoreId(fromStoreId)
            .toStoreId(toStoreId)
            .fromStoreName(blankToNull(request.fromStoreName()))
            .toStoreName(blankToNull(request.toStoreName()))
            .notes(blankToNull(request.notes()))
            .totalQuantity(totalQty)
            .createdBy(userId)
            .build();

        List<StockTransferLine> lines = new ArrayList<>();
        for (Map.Entry<UUID, BigDecimal> entry : qtyByProduct.entrySet()) {
            lines.add(StockTransferLine.builder()
                .transfer(transfer)
                .productId(entry.getKey())
                .productName(names.get(entry.getKey()))
                .productSku(skus.get(entry.getKey()))
                .quantity(entry.getValue())
                .build());
        }
        transfer.setLines(lines);
        return stockTransferRepository.save(transfer);
    }

    private void moveLotsFefo(
        Integer fromStoreId,
        Integer toStoreId,
        Map<UUID, Product> products,
        Map<UUID, BigDecimal> qtyByProduct
    ) {
        List<StockLot> available = stockLotRepository.findAvailableForProducts(fromStoreId, qtyByProduct.keySet());
        Map<UUID, List<StockLot>> byProduct = new LinkedHashMap<>();
        for (StockLot lot : available) {
            byProduct.computeIfAbsent(lot.getProduct().getId(), id -> new ArrayList<>()).add(lot);
        }

        List<StockLot> dirty = new ArrayList<>();
        List<StockLot> created = new ArrayList<>();
        for (Map.Entry<UUID, BigDecimal> entry : qtyByProduct.entrySet()) {
            UUID productId = entry.getKey();
            BigDecimal remaining = QuantityUtil.normalize(entry.getValue());
            List<StockLot> lots = byProduct.getOrDefault(productId, List.of());
            if (lots.isEmpty()) {
                // legacy stock without lots — store_stock already moved
                continue;
            }
            for (StockLot lot : lots) {
                if (remaining.signum() <= 0) {
                    break;
                }
                BigDecimal availableQty = QuantityUtil.normalize(lot.getQuantity());
                if (availableQty.signum() <= 0) {
                    continue;
                }
                BigDecimal take = availableQty.min(remaining);
                if (take.compareTo(availableQty) == 0) {
                    lot.setStoreId(toStoreId);
                    dirty.add(lot);
                } else {
                    lot.setQuantity(QuantityUtil.normalize(availableQty.subtract(take)));
                    dirty.add(lot);
                    created.add(StockLot.builder()
                        .product(products.get(productId))
                        .storeId(toStoreId)
                        .receiptLine(lot.getReceiptLine())
                        .batchNumber(lot.getBatchNumber())
                        .expiryDate(lot.getExpiryDate())
                        .quantity(take)
                        .purchasePrice(lot.getPurchasePrice())
                        .unitSellingPrice(lot.getUnitSellingPrice())
                        .build());
                }
                remaining = QuantityUtil.normalize(remaining.subtract(take));
            }
            if (remaining.signum() > 0) {
                Product product = products.get(productId);
                throw PharmacyErrors.of(
                    PharmacySaleErrors.PHARM_STOCK_LOT_INSUFFICIENT,
                    "Недостаточно партий для «" + (product != null ? product.getName() : productId) + "». Нужно ещё " + remaining
                );
            }
        }
        if (!dirty.isEmpty()) {
            stockLotRepository.saveAll(dirty);
        }
        if (!created.isEmpty()) {
            stockLotRepository.saveAll(created);
        }
    }

    private static Map<UUID, BigDecimal> aggregate(List<PharmacyTransferLineRequest> lines) {
        Map<UUID, BigDecimal> qty = new LinkedHashMap<>();
        if (lines == null) {
            return qty;
        }
        for (PharmacyTransferLineRequest line : lines) {
            if (line == null || line.productId() == null || line.quantity() == null) {
                continue;
            }
            BigDecimal q = QuantityUtil.normalize(line.quantity());
            if (q.signum() <= 0) {
                throw PharmacyErrors.of(PharmacyTransferErrors.PHARM_TRANSFER_QTY_POSITIVE);
            }
            qty.merge(line.productId(), q, QuantityUtil::add);
        }
        return qty;
    }

    private static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}

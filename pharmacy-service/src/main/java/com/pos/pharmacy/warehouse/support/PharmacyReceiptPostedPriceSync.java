package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.cache.PharmacyCatalogCacheEvictor;
import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacySaleErrors;
import com.pos.pharmacy.util.QuantityUtil;
import com.pos.pharmacy.warehouse.domain.StockReceiptStatus;
import com.pos.pharmacy.warehouse.entity.StockLot;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import com.pos.pharmacy.warehouse.repository.StockLotRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/** После проведения поля строки копируются в партию и карточку — касса видит актуальные данные. */
@Component
public class PharmacyReceiptPostedPriceSync {

    private static final BigDecimal MIN_SELLING = new BigDecimal("0.01");

    private final StockLotRepository stockLotRepository;
    private final ProductRepository productRepository;
    private final PharmacyCatalogCacheEvictor catalogCacheEvictor;
    private final PharmacyReceiptStockIncrease stockIncrease;
    private final PharmacyReceiptStockReversal stockReversal;

    public PharmacyReceiptPostedPriceSync(
        StockLotRepository stockLotRepository,
        ProductRepository productRepository,
        PharmacyCatalogCacheEvictor catalogCacheEvictor,
        PharmacyReceiptStockIncrease stockIncrease,
        PharmacyReceiptStockReversal stockReversal
    ) {
        this.stockLotRepository = stockLotRepository;
        this.productRepository = productRepository;
        this.catalogCacheEvictor = catalogCacheEvictor;
        this.stockIncrease = stockIncrease;
        this.stockReversal = stockReversal;
    }

    public void sync(StockReceipt receipt, Collection<StockReceiptLine> lines) {
        sync(receipt, lines, Map.of());
    }

    /**
     * @param previousQuantities прежние количества строк (lineId → qty), если меняли QUANTITY
     */
    public void sync(
        StockReceipt receipt,
        Collection<StockReceiptLine> lines,
        Map<UUID, BigDecimal> previousQuantities
    ) {
        if (receipt == null
            || !StockReceiptStatus.POSTED.equals(receipt.getStatus())
            || lines == null
            || lines.isEmpty()) {
            return;
        }
        List<UUID> lineIds = lines.stream()
            .map(StockReceiptLine::getId)
            .filter(Objects::nonNull)
            .toList();
        if (lineIds.isEmpty()) {
            return;
        }
        Map<UUID, StockReceiptLine> byLine = new LinkedHashMap<>();
        Map<UUID, StockReceiptLine> byProduct = new LinkedHashMap<>();
        for (StockReceiptLine line : lines) {
            if (line.getId() != null) {
                byLine.put(line.getId(), line);
            }
            if (line.getProduct() != null) {
                byProduct.put(line.getProduct().getId(), line);
            }
        }
        List<StockLot> lots = stockLotRepository.findByReceiptLineIds(lineIds);
        Map<UUID, BigDecimal> stockDeltas = new HashMap<>();
        Map<UUID, Product> productsForStock = new HashMap<>();
        for (StockLot lot : lots) {
            StockReceiptLine line = lot.getReceiptLine() == null ? null : byLine.get(lot.getReceiptLine().getId());
            if (line == null) {
                continue;
            }
            lot.setPurchasePrice(PharmacyReceiptPricing.scaleMoney(line.getPurchasePrice()));
            lot.setUnitSellingPrice(selling(line));
            lot.setBatchNumber(line.getBatchNumber());
            lot.setExpiryDate(line.getExpiryDate());
            BigDecimal previousQty = previousQuantities == null ? null : previousQuantities.get(line.getId());
            if (previousQty != null && line.getProduct() != null) {
                BigDecimal delta = QuantityUtil.subtract(line.getQuantity(), previousQty);
                if (delta.signum() != 0) {
                    BigDecimal nextLotQty = QuantityUtil.add(lot.getQuantity(), delta);
                    if (nextLotQty.signum() < 0) {
                        String name = line.getProduct().getName() != null
                            ? line.getProduct().getName()
                            : String.valueOf(line.getProduct().getId());
                        throw PharmacyErrors.of(
                            PharmacySaleErrors.PHARM_STOCK_INSUFFICIENT,
                            "Недостаточно остатка партии для «" + name + "». Доступно: " + lot.getQuantity()
                        );
                    }
                    lot.setQuantity(nextLotQty);
                    UUID productId = line.getProduct().getId();
                    stockDeltas.merge(productId, delta, QuantityUtil::add);
                    productsForStock.put(productId, line.getProduct());
                }
            }
        }
        stockLotRepository.saveAll(lots);

        applyStockDeltas(receipt.getStoreId(), productsForStock, stockDeltas);

        List<Product> products = productRepository.findAllById(byProduct.keySet());
        for (Product product : products) {
            StockReceiptLine line = byProduct.get(product.getId());
            if (line == null) {
                continue;
            }
            product.setCostPrice(PharmacyReceiptPricing.scaleMoney(line.getPurchasePrice()));
            BigDecimal selling = selling(line);
            if (selling.compareTo(MIN_SELLING) >= 0) {
                product.setSellingPrice(selling);
            }
            if (line.getVatPercent() != null) {
                product.setTaxRate(line.getVatPercent());
            }
        }
        productRepository.saveAll(products);
        catalogCacheEvictor.onStoreStockChanged(receipt.getCompanyId(), receipt.getStoreId());
        catalogCacheEvictor.onProductChanged(receipt.getCompanyId());
    }

    private void applyStockDeltas(
        Integer storeId,
        Map<UUID, Product> products,
        Map<UUID, BigDecimal> deltas
    ) {
        if (deltas.isEmpty()) {
            return;
        }
        Map<UUID, BigDecimal> increases = new HashMap<>();
        Map<UUID, BigDecimal> decreases = new HashMap<>();
        for (Map.Entry<UUID, BigDecimal> entry : deltas.entrySet()) {
            BigDecimal delta = QuantityUtil.normalize(entry.getValue());
            if (delta.signum() > 0) {
                increases.put(entry.getKey(), delta);
            } else if (delta.signum() < 0) {
                decreases.put(entry.getKey(), delta.abs());
            }
        }
        if (!increases.isEmpty()) {
            stockIncrease.increase(storeId, products, increases);
        }
        if (!decreases.isEmpty()) {
            stockReversal.reverse(storeId, products, decreases);
        }
    }

    private static BigDecimal selling(StockReceiptLine line) {
        if (line.getUnitSellingPrice() != null) {
            return PharmacyReceiptPricing.scaleMoney(line.getUnitSellingPrice());
        }
        return PharmacyReceiptPricing.scaleMoney(line.getRetailPrice());
    }
}

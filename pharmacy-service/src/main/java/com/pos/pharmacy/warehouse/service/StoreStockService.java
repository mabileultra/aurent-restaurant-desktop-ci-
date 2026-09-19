package com.pos.pharmacy.warehouse.service;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacySaleErrors;
import com.pos.pharmacy.util.QuantityUtil;
import com.pos.pharmacy.warehouse.entity.StoreStock;
import com.pos.pharmacy.warehouse.repository.StoreStockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StoreStockService {

    private final StoreStockRepository storeStockRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public BigDecimal getQuantity(UUID productId, Integer storeId) {
        return storeStockRepository.findByProductIdAndStoreId(productId, storeId)
            .map(StoreStock::getQuantity)
            .orElse(BigDecimal.ZERO);
    }

    @Transactional(readOnly = true)
    public Map<UUID, BigDecimal> getQuantities(Integer storeId, Collection<UUID> productIds) {
        Map<UUID, BigDecimal> result = new HashMap<>();
        if (storeId == null || productIds == null || productIds.isEmpty()) {
            return result;
        }
        for (UUID id : productIds) {
            if (id != null) {
                result.put(id, BigDecimal.ZERO);
            }
        }
        List<StoreStock> rows = storeStockRepository.findByStoreIdAndProductIdIn(storeId, productIds);
        for (StoreStock stock : rows) {
            result.put(stock.getProductId(), QuantityUtil.normalize(stock.getQuantity()));
        }
        return result;
    }

    @Transactional
    public void increase(Product product, Integer storeId, BigDecimal quantity) {
        if (product == null || storeId == null || quantity == null) {
            return;
        }
        BigDecimal q = QuantityUtil.normalize(quantity);
        StoreStock stock = storeStockRepository.findByProductIdAndStoreId(product.getId(), storeId)
            .orElse(StoreStock.builder()
                .productId(product.getId())
                .storeId(storeId)
                .quantity(BigDecimal.ZERO)
                .build());
        stock.setQuantity(QuantityUtil.add(stock.getQuantity(), q));
        storeStockRepository.save(stock);
        product.setStockQuantity(QuantityUtil.add(product.getStockQuantity(), q));
        productRepository.save(product);
    }

    @Transactional(readOnly = true)
    public void requireAvailable(Product product, Integer storeId, BigDecimal quantity) {
        if (product == null || storeId == null || quantity == null) {
            return;
        }
        BigDecimal need = QuantityUtil.normalize(quantity);
        if (need.signum() <= 0) {
            return;
        }
        BigDecimal available = getQuantity(product.getId(), storeId);
        if (available.compareTo(need) < 0) {
            throw PharmacyErrors.of(
                PharmacySaleErrors.PHARM_STOCK_INSUFFICIENT,
                "Недостаточно остатка для «" + product.getName() + "». Доступно: " + available
            );
        }
    }

    @Transactional
    public void decrease(Product product, Integer storeId, BigDecimal quantity) {
        if (product == null || storeId == null || quantity == null) {
            return;
        }
        Map<UUID, Product> products = Map.of(product.getId(), product);
        Map<UUID, BigDecimal> qty = Map.of(product.getId(), quantity);
        decreaseAll(storeId, products, qty);
    }

    /**
     * One stock load + one saveAll for store rows and product denormalized qty.
     * {@code quantitiesByProductId} must already be aggregated per product.
     */
    @Transactional
    public void decreaseAll(
        Integer storeId,
        Map<UUID, Product> productsById,
        Map<UUID, BigDecimal> quantitiesByProductId
    ) {
        if (storeId == null || productsById == null || quantitiesByProductId == null || quantitiesByProductId.isEmpty()) {
            return;
        }
        List<StoreStock> rows = storeStockRepository.findByStoreIdAndProductIdIn(storeId, quantitiesByProductId.keySet());
        Map<UUID, StoreStock> stockByProduct = new HashMap<>();
        for (StoreStock row : rows) {
            stockByProduct.put(row.getProductId(), row);
        }

        List<StoreStock> dirtyStock = new ArrayList<>();
        List<Product> dirtyProducts = new ArrayList<>();

        for (Map.Entry<UUID, BigDecimal> entry : quantitiesByProductId.entrySet()) {
            UUID productId = entry.getKey();
            Product product = productsById.get(productId);
            if (product == null) {
                continue;
            }
            BigDecimal need = QuantityUtil.normalize(entry.getValue());
            if (need.signum() <= 0) {
                continue;
            }
            StoreStock stock = stockByProduct.get(productId);
            BigDecimal available = stock != null
                ? QuantityUtil.normalize(stock.getQuantity())
                : BigDecimal.ZERO;
            if (available.compareTo(need) < 0) {
                throw PharmacyErrors.of(
                    PharmacySaleErrors.PHARM_STOCK_INSUFFICIENT,
                    "Недостаточно остатка для «" + product.getName() + "». Доступно: " + available
                );
            }
            stock.setQuantity(QuantityUtil.subtract(available, need));
            dirtyStock.add(stock);
            product.setStockQuantity(QuantityUtil.subtract(product.getStockQuantity(), need));
            dirtyProducts.add(product);
        }

        if (!dirtyStock.isEmpty()) {
            storeStockRepository.saveAll(dirtyStock);
        }
        if (!dirtyProducts.isEmpty()) {
            productRepository.saveAll(dirtyProducts);
        }
    }
}

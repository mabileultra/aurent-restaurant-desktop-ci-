package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.util.QuantityUtil;
import com.pos.pharmacy.warehouse.entity.StoreStock;
import com.pos.pharmacy.warehouse.repository.StoreStockRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Одним проходом списывает остаток товаров одной фактуры. */
@Component
public class PharmacyReceiptStockReversal {

    private static final int CHUNK = 400;

    private final StoreStockRepository storeStockRepository;
    private final ProductRepository productRepository;

    public PharmacyReceiptStockReversal(
        StoreStockRepository storeStockRepository,
        ProductRepository productRepository
    ) {
        this.storeStockRepository = storeStockRepository;
        this.productRepository = productRepository;
    }

    public void reverse(Integer storeId, Map<UUID, Product> products, Map<UUID, BigDecimal> quantities) {
        if (storeId == null || quantities == null || quantities.isEmpty()) {
            return;
        }
        Map<UUID, StoreStock> stocks = loadStocks(storeId, quantities.keySet());
        List<StoreStock> dirtyStocks = new ArrayList<>();
        List<Product> dirtyProducts = new ArrayList<>();
        for (Map.Entry<UUID, BigDecimal> entry : quantities.entrySet()) {
            BigDecimal need = QuantityUtil.normalize(entry.getValue());
            if (need.signum() <= 0) {
                continue;
            }
            Product product = products.get(entry.getKey());
            StoreStock stock = stocks.get(entry.getKey());
            BigDecimal available = stock == null ? BigDecimal.ZERO : QuantityUtil.normalize(stock.getQuantity());
            if (available.compareTo(need) < 0) {
                String name = product != null && product.getName() != null ? product.getName() : String.valueOf(entry.getKey());
                throw PharmacyErrors.badRequest(
                    "Недостаточно остатка для «" + name + "». Доступно: " + available
                );
            }
            stock.setQuantity(QuantityUtil.subtract(stock.getQuantity(), need));
            dirtyStocks.add(stock);
            if (product != null) {
                product.setStockQuantity(QuantityUtil.subtract(product.getStockQuantity(), need));
                dirtyProducts.add(product);
            }
        }
        if (!dirtyStocks.isEmpty()) {
            storeStockRepository.saveAll(dirtyStocks);
        }
        if (!dirtyProducts.isEmpty()) {
            productRepository.saveAll(dirtyProducts);
        }
    }

    private Map<UUID, StoreStock> loadStocks(Integer storeId, Collection<UUID> productIds) {
        List<UUID> ids = new ArrayList<>(productIds);
        Map<UUID, StoreStock> stocks = new HashMap<>();
        for (int from = 0; from < ids.size(); from += CHUNK) {
            List<UUID> chunk = ids.subList(from, Math.min(from + CHUNK, ids.size()));
            for (StoreStock stock : storeStockRepository.findByStoreIdAndProductIdIn(storeId, chunk)) {
                stocks.put(stock.getProductId(), stock);
            }
        }
        return stocks;
    }
}

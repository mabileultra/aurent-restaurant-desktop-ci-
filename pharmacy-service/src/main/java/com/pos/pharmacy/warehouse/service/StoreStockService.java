package com.pos.pharmacy.warehouse.service;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.util.QuantityUtil;
import com.pos.pharmacy.warehouse.entity.StoreStock;
import com.pos.pharmacy.warehouse.repository.StoreStockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
            throw PharmacyErrors.badRequest(
                "Недостаточно остатка для «" + product.getName() + "». Доступно: " + available
            );
        }
    }

    @Transactional
    public void decrease(Product product, Integer storeId, BigDecimal quantity) {
        if (product == null || storeId == null || quantity == null) {
            return;
        }
        BigDecimal q = QuantityUtil.normalize(quantity);
        if (q.signum() <= 0) {
            return;
        }
        requireAvailable(product, storeId, q);
        StoreStock stock = storeStockRepository.findByProductIdAndStoreId(product.getId(), storeId)
            .orElseThrow(() -> PharmacyErrors.badRequest("Нет остатка для «" + product.getName() + "»"));
        stock.setQuantity(QuantityUtil.subtract(stock.getQuantity(), q));
        storeStockRepository.save(stock);
        product.setStockQuantity(QuantityUtil.subtract(product.getStockQuantity(), q));
        productRepository.save(product);
    }
}

package com.pos.catalog.service.product.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.repository.ProductRepository;
import com.pos.exception.PosExceptions;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Managed {@link Product} access for modules that still need JPA associations (SaleItem / stock lines).
 * Prefer {@link com.pos.catalog.api.CatalogFacade} + {@code ProductRef} when entity is not required.
 */
@Component
@RequiredArgsConstructor
public class CatalogManagedProductLoader {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public Map<UUID, Product> requireActiveWithCompany(Collection<UUID> ids) {
        Map<UUID, Product> byId = productRepository.findAllByIdWithCompany(ids).stream()
            .collect(Collectors.toMap(Product::getId, Function.identity(), (a, b) -> a, LinkedHashMap::new));

        for (UUID id : ids) {
            Product product = byId.get(id);
            if (product == null) {
                throw PosExceptions.notFound("Product", id);
            }
            if (!product.isActive()) {
                throw PosExceptions.badRequest("Product is inactive: " + product.getName());
            }
        }
        return byId;
    }

    @Transactional(readOnly = true)
    public Product requireById(UUID productId) {
        return productRepository.findById(productId)
            .orElseThrow(() -> PosExceptions.notFound("Product", productId));
    }

    @Transactional(readOnly = true)
    public Product requireActive(UUID productId) {
        Product product = requireById(productId);
        if (!product.isActive()) {
            throw PosExceptions.badRequest("Product is not active: " + product.getName());
        }
        return product;
    }

    @Transactional(readOnly = true)
    public List<Product> findAllById(Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return productRepository.findAllById(ids);
    }

    @Transactional(readOnly = true)
    public List<Product> findAllByIdWithCategory(Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return productRepository.findAllByIdWithCategory(ids);
    }

    /** Persist card fields (price/cost/flags). Stock qty must go through StoreStockService. */
    @Transactional
    public Product saveCard(Product product) {
        return productRepository.save(product);
    }
}

package com.pos.pharmacy.catalog.repository;

import com.pos.pharmacy.catalog.entity.ProductAttribute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ProductAttributeRepository extends JpaRepository<ProductAttribute, ProductAttribute.ProductAttributeId> {

    List<ProductAttribute> findByProductId(UUID productId);

    List<ProductAttribute> findByProductIdIn(Collection<UUID> productIds);

    void deleteByProductId(UUID productId);
}

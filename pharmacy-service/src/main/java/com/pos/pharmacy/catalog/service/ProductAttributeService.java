package com.pos.pharmacy.catalog.service;

import com.pos.pharmacy.catalog.entity.ProductAttribute;
import com.pos.pharmacy.catalog.repository.ProductAttributeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductAttributeService {

    private final ProductAttributeRepository repository;

    @Transactional(readOnly = true)
    public Map<String, String> getAttributes(UUID productId) {
        List<ProductAttribute> attrs = repository.findByProductId(productId);
        Map<String, String> map = new LinkedHashMap<>();
        for (ProductAttribute attr : attrs) {
            map.put(attr.getFieldKey(), attr.getValueText());
        }
        return map;
    }

    @Transactional(readOnly = true)
    public Map<UUID, Map<String, String>> getAttributesByProductIds(Collection<UUID> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, Map<String, String>> grouped = new HashMap<>();
        for (ProductAttribute attr : repository.findByProductIdIn(productIds)) {
            grouped.computeIfAbsent(attr.getProductId(), id -> new LinkedHashMap<>())
                .put(attr.getFieldKey(), attr.getValueText());
        }
        return grouped;
    }

    @Transactional
    public void saveAttributes(UUID productId, Map<String, String> attributes) {
        repository.deleteByProductId(productId);
        if (attributes == null || attributes.isEmpty()) {
            return;
        }
        attributes.forEach((key, value) -> {
            if (key == null || key.isBlank() || value == null) {
                return;
            }
            repository.save(ProductAttribute.builder()
                .productId(productId)
                .fieldKey(key.trim())
                .valueText(value)
                .build());
        });
    }

    /** Одно поле без удаления остальных атрибутов (приход → карточка). */
    @Transactional
    public void upsertAttribute(UUID productId, String fieldKey, String valueText) {
        if (productId == null || fieldKey == null || fieldKey.isBlank() || valueText == null) {
            return;
        }
        String key = fieldKey.trim();
        ProductAttribute.ProductAttributeId id = new ProductAttribute.ProductAttributeId(productId, key);
        ProductAttribute attr = repository.findById(id).orElseGet(() -> ProductAttribute.builder()
            .productId(productId)
            .fieldKey(key)
            .build());
        attr.setValueText(valueText);
        repository.save(attr);
    }
}

package com.pos.pharmacy.catalog.service;

import com.pos.pharmacy.catalog.entity.ProductAttribute;
import com.pos.pharmacy.catalog.repository.ProductAttributeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
}

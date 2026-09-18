package com.pos.pharmacy.sales.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.service.ProductAttributeService;
import com.pos.pharmacy.catalog.support.PharmacyPackSupport;
import com.pos.pharmacy.domain.ProductQuantityRules;
import com.pos.pharmacy.sales.dto.SaleItemRequest;
import com.pos.pharmacy.util.QuantityValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CheckoutQuantityResolver {

    private final ProductAttributeService productAttributeService;

    public Map<UUID, Map<String, String>> loadAttributes(Set<UUID> productIds) {
        Map<UUID, Map<String, String>> result = new HashMap<>();
        if (productIds == null || productIds.isEmpty()) {
            return result;
        }
        Map<UUID, Map<String, String>> loaded = productAttributeService.getAttributesByProductIds(productIds);
        for (UUID productId : productIds) {
            result.put(productId, loaded.getOrDefault(productId, Map.of()));
        }
        return result;
    }

    public Map<UUID, Map<String, String>> loadAttributes(List<SaleItemRequest> items) {
        Set<UUID> ids = new HashSet<>();
        if (items != null) {
            items.forEach(item -> ids.add(item.productId()));
        }
        return loadAttributes(ids);
    }

    public ProductQuantityRules rulesFor(Product product, Map<UUID, Map<String, String>> attributesByProductId) {
        Map<String, String> attributes = attributesByProductId.getOrDefault(product.getId(), Map.of());
        return PharmacyPackSupport.checkoutQuantityRules(product, attributes);
    }

    public BigDecimal normalizeQuantity(
        Product product,
        BigDecimal rawQuantity,
        Map<UUID, Map<String, String>> attributesByProductId
    ) {
        ProductQuantityRules rules = rulesFor(product, attributesByProductId);
        return QuantityValidator.normalizeForProduct(rules, rawQuantity);
    }

    public void validateQuantity(
        Product product,
        BigDecimal quantity,
        Map<UUID, Map<String, String>> attributesByProductId
    ) {
        ProductQuantityRules rules = rulesFor(product, attributesByProductId);
        QuantityValidator.validate(rules, quantity);
    }
}

package com.pos.sales.service.sale.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.service.ProductAttributeService;
import com.pos.catalog.service.product.PharmacyPackSupport;
import com.pos.domain.ProductQuantityRules;
import com.pos.util.QuantityValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
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
        for (UUID productId : productIds) {
            result.put(productId, productAttributeService.getAttributes(productId));
        }
        return result;
    }

    public ProductQuantityRules rulesFor(Product product, Map<UUID, Map<String, String>> attributesByProductId) {
        Map<String, String> attributes = attributesByProductId.getOrDefault(product.getId(), Map.of());
        return PharmacyPackSupport.checkoutQuantityRules(product, attributes);
    }

    public BigDecimal normalizeQuantity(Product product, BigDecimal rawQuantity, Map<UUID, Map<String, String>> attributesByProductId) {
        ProductQuantityRules rules = rulesFor(product, attributesByProductId);
        return QuantityValidator.normalizeForProduct(rules, rawQuantity);
    }

    public void validateQuantity(Product product, BigDecimal quantity, Map<UUID, Map<String, String>> attributesByProductId) {
        ProductQuantityRules rules = rulesFor(product, attributesByProductId);
        QuantityValidator.validate(rules, quantity);
    }
}

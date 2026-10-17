package com.pos.restaurant.edge.service;

import com.pos.restaurant.edge.entity.EdgeProduct;
import com.pos.restaurant.edge.repository.EdgeProductRepository;
import com.pos.restaurant.recipe.dto.IngredientConsumeRequest;
import com.pos.restaurant.revenue.service.PosInventoryClient;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Local stock consume/restore when restaurant-service runs in edge mode (no cloud POS).
 */
@Component
@Primary
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgePosInventoryClient implements PosInventoryClient {

    private final EdgeProductRepository productRepository;

    @Override
    @Transactional
    public boolean consumeIngredients(IngredientConsumeRequest request) {
        return adjust(request, true);
    }

    @Override
    @Transactional
    public boolean restoreIngredients(IngredientConsumeRequest request) {
        return adjust(request, false);
    }

    private boolean adjust(IngredientConsumeRequest request, boolean consume) {
        if (request == null || request.lines() == null || request.lines().isEmpty()) {
            return true;
        }
        for (var line : request.lines()) {
            if (line == null || line.productId() == null || line.quantity() == null) continue;
            EdgeProduct p = productRepository.findById(line.productId()).orElse(null);
            if (p == null) continue;
            BigDecimal delta = line.quantity().abs();
            BigDecimal next = consume
                ? p.getStockQty().subtract(delta)
                : p.getStockQty().add(delta);
            p.setStockQty(next);
            productRepository.save(p);
        }
        return true;
    }
}

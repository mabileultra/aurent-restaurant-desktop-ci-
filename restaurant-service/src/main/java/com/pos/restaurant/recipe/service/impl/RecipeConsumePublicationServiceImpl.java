package com.pos.restaurant.recipe.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.restaurant.recipe.dto.IngredientConsumeRequest;
import com.pos.restaurant.recipe.entity.Recipe;
import com.pos.restaurant.recipe.entity.RecipeLine;
import com.pos.restaurant.recipe.repository.RecipeLineRepository;
import com.pos.restaurant.recipe.repository.RecipeRepository;
import com.pos.restaurant.recipe.service.RecipeConsumePublicationService;
import com.pos.restaurant.recipe.support.RecipeExplosion;
import com.pos.restaurant.revenue.domain.RevenueOutboxChannel;
import com.pos.restaurant.revenue.entity.RevenueOutbox;
import com.pos.restaurant.revenue.service.RevenueOutboxService;
import com.pos.restaurant.revenue.support.RestaurantSaleCompletedFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecipeConsumePublicationServiceImpl implements RecipeConsumePublicationService {

    private final RecipeRepository recipeRepository;
    private final RecipeLineRepository recipeLineRepository;
    private final RecipeExplosion recipeExplosion;
    private final RevenueOutboxService outboxService;
    private final ObjectMapper objectMapper;

    @Override
    public void publishPaidOrder(FloorOrder order, List<FloorOrderItem> items, FloorOrderPayment payment) {
        List<UUID> menuItemIds = items.stream()
            .map(FloorOrderItem::getMenuItem)
            .filter(Objects::nonNull)
            .map(item -> item.getId())
            .distinct()
            .toList();
        if (menuItemIds.isEmpty()) {
            return;
        }
        Map<UUID, Recipe> recipes = recipeRepository
            .findByMenuItemIdInAndCompanyId(menuItemIds, order.getCompanyId())
            .stream()
            .collect(Collectors.toMap(recipe -> recipe.getMenuItem().getId(), recipe -> recipe, (a, b) -> a));
        if (recipes.isEmpty()) {
            return;
        }
        Map<UUID, List<RecipeLine>> lines = recipeLineRepository
            .findByRecipeIdIn(recipes.values().stream().map(Recipe::getId).toList())
            .stream()
            .collect(Collectors.groupingBy(line -> line.getRecipe().getId()));
        Map<UUID, BigDecimal> consumed = recipeExplosion.explode(items, recipes, lines);
        if (consumed.isEmpty()) {
            return;
        }
        IngredientConsumeRequest payload = new IngredientConsumeRequest(
            order.getCompanyId(),
            order.getStoreId(),
            order.getId(),
            payment.getPaidByUserId(),
            RestaurantSaleCompletedFactory.receiptNumber(order),
            consumed.entrySet().stream()
                .map(entry -> new IngredientConsumeRequest.IngredientConsumeLine(entry.getKey(), entry.getValue()))
                .toList()
        );
        RevenueOutbox row = outboxService.enqueue(
            RevenueOutboxChannel.STOCK_CONSUME,
            "pos.internal.stock-consume",
            "rst-stock:" + order.getId(),
            "rst-stock:" + order.getId(),
            writeJson(payload)
        );
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            outboxService.trySend(row.getId());
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                outboxService.trySend(row.getId());
            }
        });
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Stock consume payload serialization failed", ex);
        }
    }
}

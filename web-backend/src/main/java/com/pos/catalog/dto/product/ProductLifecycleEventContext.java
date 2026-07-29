package com.pos.catalog.dto.product;

import com.pos.sales.entity.Sale;
import com.pos.inventory.entity.StockMovement;

import java.math.BigDecimal;

/**
 * Контекст для маппинга строки журнала в {@link ProductLifecycleEventResponse}.
 */
public record ProductLifecycleEventContext(
    StockMovement movement,
    Integer stockAfter,
    ProductLifecycleReferenceLabel reference,
    BigDecimal unitCostEstimate,
    BigDecimal costDeltaEstimate,
    Sale linkedSale
) {}

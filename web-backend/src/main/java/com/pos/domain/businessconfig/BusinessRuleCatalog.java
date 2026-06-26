package com.pos.domain.businessconfig;

import java.util.Arrays;
import java.util.List;

public final class BusinessRuleCatalog {

    public record RuleDefinition(String key, String labelRu, boolean defaultValue) {}

    public static final List<RuleDefinition> ALL = List.of(
        new RuleDefinition("product.allowFraction", "Дробное количество на товаре", false),
        new RuleDefinition("product.defaultWeightSale", "Весовая продажа по умолчанию", false),
        new RuleDefinition("stock.trackExpiry", "Учёт срока годности", false),
        new RuleDefinition("stock.trackBatches", "Учёт партий", false),
        new RuleDefinition("cashier.weightEntry", "Ввод веса на кассе", false),
        new RuleDefinition("label.showWeight", "Вес на этикетке", false),
        new RuleDefinition("label.showSize", "Размер на этикетке", false)
    );

    private BusinessRuleCatalog() {}

    public static boolean parseBoolean(String value) {
        if (value == null) {
            return false;
        }
        return Arrays.asList("true", "1", "yes", "on").contains(value.trim().toLowerCase());
    }
}

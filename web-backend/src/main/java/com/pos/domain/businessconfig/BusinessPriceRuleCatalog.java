package com.pos.domain.businessconfig;

import java.util.List;

public final class BusinessPriceRuleCatalog {

    public record RuleDefinition(String key, String labelRu, String defaultValue, boolean numeric) {}

    public static final List<RuleDefinition> ALL = List.of(
        new RuleDefinition("price.requireCost", "Себестоимость обязательна", "false", false),
        new RuleDefinition("price.hideCost", "Скрыть себестоимость", "false", false),
        new RuleDefinition("price.hideInitialStock", "Скрыть начальный остаток", "false", false),
        new RuleDefinition("price.minMarginPercent", "Мин. наценка, %", "0", true),
        new RuleDefinition("price.maxDiscountPercent", "Макс. скидка, %", "100", true)
    );

    private BusinessPriceRuleCatalog() {}
}

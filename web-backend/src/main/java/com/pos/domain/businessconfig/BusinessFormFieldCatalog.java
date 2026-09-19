package com.pos.domain.businessconfig;

import java.util.List;

/**
 * Включение/отключение секций формы «Добавить товар» в конструкторе бизнеса.
 * Ключи совпадают с showSection() на фронте.
 */
public final class BusinessFormFieldCatalog {

    public record FieldDefinition(String key, String section, String labelRu, boolean defaultEnabled) {}

    public static final String KEY_PREFIX = "catalog.form.";

    public static final List<FieldDefinition> ALL = List.of(
        new FieldDefinition("catalog.form.tasnif", "tasnif", "Поиск Tasnif / ИКПУ и фискальные коды", true),
        new FieldDefinition("catalog.form.skuField", "skuField", "SKU", true),
        new FieldDefinition("catalog.form.categoryField", "categoryField", "Категория", true),
        new FieldDefinition("catalog.form.typeSelectors", "typeSelectors", "Тип продажи и единица измерения", true),
        new FieldDefinition("catalog.form.productTypeField", "productTypeField", "Тип товара (розница/блюдо/…)", true),
        new FieldDefinition("catalog.form.retailFlags", "retailFlags", "Флаги: поштучно / маркировка", true),
        new FieldDefinition("catalog.form.ownerVat", "ownerVat", "Владелец, НДС, комиссия", true),
        new FieldDefinition("catalog.form.accounting", "accounting", "Цены и учёт", true),
        new FieldDefinition("catalog.form.accountingCost", "accountingCost", "Себестоимость", true),
        new FieldDefinition("catalog.form.accountingSell", "accountingSell", "Цена продажи", true),
        new FieldDefinition("catalog.form.accountingDiscount", "accountingDiscount", "Скидка по умолчанию", true),
        new FieldDefinition("catalog.form.accountingStock", "accountingStock", "Начальный остаток", true),
        new FieldDefinition("catalog.form.storePrices", "storePrices", "Цены по магазинам", true),
        new FieldDefinition("catalog.form.barcodes", "barcodes", "Штрихкоды", true),
        new FieldDefinition("catalog.form.dynamicFields", "dynamicFields", "Доп. поля типа бизнеса", true)
    );

    private BusinessFormFieldCatalog() {}

    public static String sectionOf(String ruleKey) {
        if (ruleKey == null || !ruleKey.startsWith(KEY_PREFIX)) {
            return null;
        }
        return ruleKey.substring(KEY_PREFIX.length());
    }
}

package com.pos.domain.businessconfig;

import java.util.List;

/**
 * Включение/отключение полей формы «Добавить товар» в конструкторе бизнеса.
 * Ключи совпадают с showSection() на фронте.
 */
public final class BusinessFormFieldCatalog {

    public record FieldDefinition(String key, String section, String labelRu, boolean defaultEnabled) {}

    public static final String KEY_PREFIX = "catalog.form.";

    public static final List<FieldDefinition> ALL = List.of(
        new FieldDefinition("catalog.form.tasnifSearch", "tasnifSearch", "Поиск Tasnif", true),
        new FieldDefinition("catalog.form.fiscalExternalId", "fiscalExternalId", "ID товара (фискальный)", true),
        new FieldDefinition("catalog.form.fiscalIkpu", "fiscalIkpu", "ИКПУ", true),
        new FieldDefinition("catalog.form.fiscalUnitMeasure", "fiscalUnitMeasure", "Код ед. измерения (фискал)", true),
        new FieldDefinition("catalog.form.fiscalPackageCode", "fiscalPackageCode", "Код упаковки", true),

        new FieldDefinition("catalog.form.skuField", "skuField", "SKU", true),
        new FieldDefinition("catalog.form.categoryField", "categoryField", "Категория", true),
        new FieldDefinition("catalog.form.typeSelectors", "typeSelectors", "Тип продажи и единица", true),
        new FieldDefinition("catalog.form.productTypeField", "productTypeField", "Тип товара", true),
        new FieldDefinition("catalog.form.retailFlags", "retailFlags", "Поштучно / маркировка", true),
        new FieldDefinition("catalog.form.activeField", "activeField", "Активен", true),

        new FieldDefinition("catalog.form.ownerType", "ownerType", "Тип владельца", true),
        new FieldDefinition("catalog.form.vatField", "vatField", "НДС", true),
        new FieldDefinition("catalog.form.commissionTin", "commissionTin", "Комиссионный ИНН", true),
        new FieldDefinition("catalog.form.commissionPinfl", "commissionPinfl", "Комиссионный ПИНФЛ", true),

        new FieldDefinition("catalog.form.accounting", "accounting", "Блок учёта", true),
        new FieldDefinition("catalog.form.accountingCost", "accountingCost", "Себестоимость", true),
        new FieldDefinition("catalog.form.accountingSell", "accountingSell", "Цена продажи", true),
        new FieldDefinition("catalog.form.accountingDiscount", "accountingDiscount", "Скидка", true),
        new FieldDefinition("catalog.form.accountingStock", "accountingStock", "Начальный остаток", true),
        new FieldDefinition("catalog.form.accountingLowStock", "accountingLowStock", "Порог «мало»", true),
        new FieldDefinition("catalog.form.accountingLocation", "accountingLocation", "Расположение", true),
        new FieldDefinition("catalog.form.descriptionField", "descriptionField", "Описание", true),

        new FieldDefinition("catalog.form.storePrices", "storePrices", "Цены по магазинам", true),

        new FieldDefinition("catalog.form.barcodes", "barcodes", "Штрихкод", true),
        new FieldDefinition("catalog.form.pluField", "pluField", "Код PLU", true),
        new FieldDefinition("catalog.form.extraBarcodes", "extraBarcodes", "Доп. штрихкоды", true),

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

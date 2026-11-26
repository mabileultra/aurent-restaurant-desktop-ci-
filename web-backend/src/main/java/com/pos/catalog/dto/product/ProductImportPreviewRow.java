package com.pos.catalog.dto.product;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductImportPreviewRow(
    int rowNum,
    String sku,
    String name,
    String ikpu,
    String barcode,
    /** Расположение на складе (из файла или значение по умолчанию при предпросмотре). */
    String storageLocation,
    /** Номер e-счёт-фактуры (напр. IS-00008429), только для источника UZ_INVOICE. */
    String uzInvoiceDocumentId,
    String unitOfMeasure,
    /** Тип продажи из файла (sale_type), если колонка задана. */
    String importSaleType,
    /** Вычисленный тип: PIECE / WEIGHT / SERVICE (для предпросмотра). */
    String saleType,
    /** Канонический код единицы (PCS, L, KG…) из quantity rules. */
    String unitCode,
    BigDecimal quantity,
    BigDecimal fileSellingPrice,
    /** Себестоимость / закупочная из файла (cost_price), если есть. */
    BigDecimal costPrice,
    BigDecimal existingSellingPrice,
    BigDecimal taxRatePercent,
    String status,
    /** Id уже существующей карточки (STATUS_DUPLICATE) — для привязки к кассе / прихода. */
    UUID existingProductId,
    String existingSku,
    String existingName,
    /** Категория существующей карточки — показать в превью, не затирать при импорте. */
    Integer existingCategoryId,
    String existingCategoryName,
    String message
) {
    public static final String STATUS_NEW = "NEW";
    public static final String STATUS_DUPLICATE = "DUPLICATE";
    public static final String STATUS_INVALID = "INVALID";
}

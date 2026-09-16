package com.pos.pharmacy.warehouse.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PharmacyStockReceiptLineResponse(
    UUID id,
    UUID productId,
    String productName,
    String sku,
    String manufacturer,
    String country,
    String dosageForm,
    BigDecimal quantity,
    BigDecimal purchasePrice,
    BigDecimal unitSellingPrice,
    BigDecimal lineCost,
    BigDecimal vatPercent,
    BigDecimal markupPercent,
    BigDecimal unitsInPack,
    BigDecimal purchasePriceWithVat,
    BigDecimal retailPrice,
    BigDecimal unitRetailPrice,
    BigDecimal lineRetail,
    String batchNumber,
    LocalDate expiryDate
) {}

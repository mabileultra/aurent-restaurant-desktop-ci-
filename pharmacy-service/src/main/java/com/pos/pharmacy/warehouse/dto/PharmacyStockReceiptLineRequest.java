package com.pos.pharmacy.warehouse.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PharmacyStockReceiptLineRequest(
    @NotNull UUID productId,
    @NotNull @DecimalMin("0.001") BigDecimal quantity,
    @NotNull @DecimalMin("0.0") BigDecimal purchasePrice,
    @NotNull @DecimalMin("0.0") BigDecimal unitSellingPrice,
    BigDecimal vatPercent,
    BigDecimal markupPercent,
    BigDecimal unitsInPack,
    BigDecimal purchasePriceWithVat,
    BigDecimal retailPrice,
    BigDecimal unitRetailPrice,
    String batchNumber,
    LocalDate expiryDate
) {}

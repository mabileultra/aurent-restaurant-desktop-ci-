package com.pos.pharmacy.warehouse.dto.importing;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PharmacyImportMatchItem(
    int rowIndex,
    String excelName,
    String manufacturer,
    String country,
    String status,
    String message,
    UUID productId,
    String productName,
    BigDecimal quantity,
    BigDecimal purchasePrice,
    BigDecimal vatPercent,
    BigDecimal retailPrice,
    String batchNumber,
    LocalDate expiryDate,
    String barcode,
    String ikpu,
    BigDecimal unitsInPack
) {}

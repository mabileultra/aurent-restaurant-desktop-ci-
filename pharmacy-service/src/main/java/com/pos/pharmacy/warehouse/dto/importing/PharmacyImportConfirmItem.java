package com.pos.pharmacy.warehouse.dto.importing;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PharmacyImportConfirmItem(
    int rowIndex,
    UUID productId,
    boolean createIfMissing,
    String excelName,
    String manufacturer,
    String country,
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

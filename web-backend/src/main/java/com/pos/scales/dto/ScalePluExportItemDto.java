package com.pos.scales.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Бренд-агностичная строка PLU для выгрузки в любые умные весы.
 */
public record ScalePluExportItemDto(
    UUID productId,
    String plu,
    String name,
    String sku,
    BigDecimal pricePerKg,
    String unitCode
) {}

package com.pos.pharmacy.pricing.registry.dto;

import java.math.BigDecimal;

/** Одна строка Excel реестра после парсинга. */
public record RegistryParsedRow(
    String pharmId,
    String barcode,
    String tradeName,
    BigDecimal limitPriceVat
) {}

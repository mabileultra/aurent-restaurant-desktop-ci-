package com.pos.pharmacy.catalog.dto;

import java.util.List;

/**
 * Сводка каталога: поставщики с приходов; если поставщиков нет —
 * приходы с товарами (OPENING cutover).
 */
public record PharmacyProductSupplierStatsResponse(
    long totalProducts,
    long activeProducts,
    List<PharmacyProductSupplierStat> suppliers,
    List<PharmacyProductReceiptStat> receipts
) {}

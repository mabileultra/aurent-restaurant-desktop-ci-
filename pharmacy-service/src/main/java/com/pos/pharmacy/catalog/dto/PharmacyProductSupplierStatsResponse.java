package com.pos.pharmacy.catalog.dto;

import java.util.List;

/** Сводка каталога + поставщики с товарами из приходов. */
public record PharmacyProductSupplierStatsResponse(
    long totalProducts,
    long activeProducts,
    List<PharmacyProductSupplierStat> suppliers
) {}

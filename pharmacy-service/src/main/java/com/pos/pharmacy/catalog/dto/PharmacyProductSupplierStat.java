package com.pos.pharmacy.catalog.dto;

import java.util.UUID;

/** Карточка поставщика на странице «Товары» — только из pharmacy DB. */
public record PharmacyProductSupplierStat(
    UUID supplierId,
    String supplierName,
    long productCount
) {}

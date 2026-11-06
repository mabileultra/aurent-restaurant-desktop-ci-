package com.pos.pharmacy.catalog.dto;

import java.util.UUID;

/** Карточка прихода на странице «Товары» (cutover / OPENING без поставщика). */
public record PharmacyProductReceiptStat(
    UUID receiptId,
    String receiptNumber,
    String receiptType,
    String status,
    long productCount
) {}

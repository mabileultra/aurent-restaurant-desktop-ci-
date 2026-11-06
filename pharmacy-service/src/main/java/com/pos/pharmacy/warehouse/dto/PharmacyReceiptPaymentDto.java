package com.pos.pharmacy.warehouse.dto;

import java.math.BigDecimal;

/** Оплаченная часть прихода: CASH / CARD / TRANSFER (долг — остаток, не строка). */
public record PharmacyReceiptPaymentDto(
    String method,
    BigDecimal amount
) {}

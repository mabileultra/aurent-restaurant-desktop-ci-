package com.pos.restaurant.payment.dto;

import com.pos.shared.payment.CardCategory;
import com.pos.restaurant.payment.domain.PaymentCardType;
import com.pos.restaurant.payment.domain.PaymentMethod;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record OrderPaymentResponse(
    UUID id,
    UUID orderId,
    PaymentMethod method,
    BigDecimal amount,
    BigDecimal cashAmount,
    BigDecimal cardAmount,
    BigDecimal amountTendered,
    BigDecimal changeGiven,
    PaymentCardType cardType,
    /** AUR-17: CORPORATE / PERSONAL / SOCIAL или null. */
    CardCategory cardCategory,
    /** AUR-17: RRN транзакции, 12 цифр, или null. */
    String rrn,
    /** AUR-17: маска номера социальной карты (8600********1234) или null. */
    String socialCardNumber,
    Instant paidAt,
    String fiscalStatus,
    String fiscalSign,
    String fiscalReceiptSeq,
    String multikassaSaleId,
    String fiscalTerminalId,
    Instant fiscalizedAt
) {}

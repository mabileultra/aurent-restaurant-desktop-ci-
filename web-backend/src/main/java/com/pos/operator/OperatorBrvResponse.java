package com.pos.operator;

import java.math.BigDecimal;

/**
 * Актуальное значение БРВ и рассчитанный порог наличной оплаты.
 */
public record OperatorBrvResponse(
    BigDecimal brvAmount,
    String currency,
    BigDecimal cashLimitBrvUnits,
    BigDecimal cashPaymentLimitSoum,
    String asOfIso,
    String zoneId
) {
}

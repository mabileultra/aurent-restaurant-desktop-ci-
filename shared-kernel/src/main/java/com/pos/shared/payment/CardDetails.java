package com.pos.shared.payment;

/**
 * Нормализованные реквизиты оплаты картой со слип-чека терминала.
 *
 * @param category         категория карты или {@code null}
 * @param rrn              RRN, 12 цифр, или {@code null}
 * @param socialCardNumber маска номера социальной карты (4 цифры + 8 звёздочек + 4 цифры) или {@code null}
 */
public record CardDetails(CardCategory category, String rrn, String socialCardNumber) {

    public static final CardDetails EMPTY = new CardDetails(null, null, null);
}

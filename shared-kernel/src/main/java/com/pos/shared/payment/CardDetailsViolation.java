package com.pos.shared.payment;

/**
 * Нарушение правил реквизитов карты. Текст не содержит введённого значения.
 */
public enum CardDetailsViolation {
    NOT_CARD_PAYMENT("paymentMethod", "Реквизиты карты допустимы только при оплате картой"),
    CATEGORY_UNKNOWN("cardCategory", "Категория карты должна быть CORPORATE, PERSONAL или SOCIAL"),
    RRN_FORMAT("rrn", "RRN должен состоять ровно из 12 цифр"),
    SOCIAL_NUMBER_UNMASKED("socialCardNumber", "Полный номер социальной карты передавать нельзя, только маску"),
    SOCIAL_NUMBER_FORMAT("socialCardNumber", "Маска социальной карты: первые 4 цифры, 8 звёздочек, последние 4 цифры"),
    SOCIAL_NUMBER_NOT_SOCIAL("socialCardNumber", "Номер социальной карты допустим только для категории SOCIAL");

    private final String field;
    private final String message;

    CardDetailsViolation(String field, String message) {
        this.field = field;
        this.message = message;
    }

    /** Имя поля запроса, к которому относится нарушение. */
    public String field() {
        return field;
    }

    /** Текст для клиента и логов, без значения поля. */
    public String message() {
        return message;
    }
}

package com.pos.pharmacy.exception.errorcode;

import com.pos.pharmacy.exception.PharmacyErrorCode;
import org.springframework.http.HttpStatus;

public enum PharmacySaleErrors implements PharmacyErrorCode {
    PHARM_SALE_NOT_FOUND(HttpStatus.NOT_FOUND, "Продажа не найдена"),
    PHARM_SALE_RECEIPT_NOT_FOUND(HttpStatus.NOT_FOUND, "Чек не найден"),
    PHARM_SALE_ALREADY_VOIDED(HttpStatus.BAD_REQUEST, "Чек уже отменён"),
    PHARM_SALE_ALREADY_RETURNED(HttpStatus.BAD_REQUEST, "Чек уже полностью возвращён"),
    PHARM_SALE_ITEM_NOT_FOUND(HttpStatus.BAD_REQUEST, "Позиция чека не найдена"),
    PHARM_SALE_RETURN_QTY_EXCEEDED(HttpStatus.BAD_REQUEST, "Нельзя вернуть больше, чем осталось по позиции"),
    PHARM_SALE_RETURN_QTY_REQUIRED(HttpStatus.BAD_REQUEST, "Укажите количество для возврата"),
    PHARM_SALE_TYPE_UNSUPPORTED(HttpStatus.BAD_REQUEST, "Аптека поддерживает только обычную продажу"),
    PHARM_SALE_PAYMENT_REQUIRED(HttpStatus.BAD_REQUEST, "Укажите способ оплаты"),
    PHARM_SALE_PAYMENT_UNKNOWN(HttpStatus.BAD_REQUEST, "Неизвестный способ оплаты"),
    PHARM_SALE_PAYMENT_UNSUPPORTED(HttpStatus.BAD_REQUEST, "Способ оплаты не поддерживается"),
    PHARM_SALE_RECEIPT_TYPE_UNKNOWN(HttpStatus.BAD_REQUEST, "Неизвестный тип чека"),
    PHARM_SALE_CARD_TYPE_UNKNOWN(HttpStatus.BAD_REQUEST, "Неизвестный тип карты"),
    PHARM_SALE_PAYMENT_MISMATCH(HttpStatus.BAD_REQUEST, "Сумма оплаты не совпадает с итогом чека"),
    PHARM_SALE_CASH_SHORT(HttpStatus.BAD_REQUEST, "Получено наличными меньше суммы оплаты"),
    PHARM_SALE_MIXED_CASH_REQUIRED(HttpStatus.BAD_REQUEST, "Укажите сумму наличными для смешанной оплаты"),
    PHARM_SALE_AMOUNT_NEGATIVE(HttpStatus.BAD_REQUEST, "Суммы оплаты не могут быть отрицательными"),
    PHARM_SALE_AMOUNT_REQUIRED(HttpStatus.BAD_REQUEST, "Укажите хотя бы одну сумму оплаты"),
    PHARM_SALE_MIXED_CASH_SHORT(HttpStatus.BAD_REQUEST, "Получено наличными меньше наличной части"),
    PHARM_STOCK_INSUFFICIENT(HttpStatus.BAD_REQUEST, "Недостаточно остатка"),
    PHARM_STOCK_LOT_INSUFFICIENT(HttpStatus.BAD_REQUEST, "Недостаточно партий (серия/срок)");

    private final HttpStatus status;
    private final String message;

    PharmacySaleErrors(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    @Override
    public HttpStatus status() {
        return status;
    }

    @Override
    public String message() {
        return message;
    }
}

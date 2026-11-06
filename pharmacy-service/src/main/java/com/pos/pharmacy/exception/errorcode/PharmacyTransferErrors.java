package com.pos.pharmacy.exception.errorcode;

import com.pos.pharmacy.exception.PharmacyErrorCode;
import org.springframework.http.HttpStatus;

public enum PharmacyTransferErrors implements PharmacyErrorCode {
    PHARM_TRANSFER_SAME_STORE(HttpStatus.BAD_REQUEST, "Склады «откуда» и «куда» должны отличаться"),
    PHARM_TRANSFER_RECEIPT_NOT_POSTED(HttpStatus.BAD_REQUEST, "Перемещать можно только проведённый приход"),
    PHARM_TRANSFER_EMPTY(HttpStatus.BAD_REQUEST, "Нечего перемещать: остаток по приходу уже ушёл с этой точки"),
    PHARM_TRANSFER_NOT_FOUND(HttpStatus.NOT_FOUND, "Перемещение не найдено"),
    PHARM_TRANSFER_TO_STORE_REQUIRED(HttpStatus.BAD_REQUEST, "Укажите филиал назначения"),
    PHARM_TRANSFER_NEED_LINES(HttpStatus.BAD_REQUEST, "Добавьте хотя бы одну строку товара"),
    PHARM_TRANSFER_QTY_POSITIVE(HttpStatus.BAD_REQUEST, "Количество должно быть больше нуля"),
    PHARM_TRANSFER_FROM_STORE_REQUIRED(HttpStatus.BAD_REQUEST, "Укажите склад отправления");

    private final HttpStatus status;
    private final String message;

    PharmacyTransferErrors(HttpStatus status, String message) {
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

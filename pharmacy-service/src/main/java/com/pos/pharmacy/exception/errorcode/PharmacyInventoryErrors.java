package com.pos.pharmacy.exception.errorcode;

import com.pos.pharmacy.exception.PharmacyErrorCode;
import org.springframework.http.HttpStatus;

public enum PharmacyInventoryErrors implements PharmacyErrorCode {
    PHARM_INVENTORY_NEED_LINES(HttpStatus.BAD_REQUEST, "Добавьте хотя бы одну строку инвентаризации"),
    PHARM_INVENTORY_NOT_FOUND(HttpStatus.NOT_FOUND, "Инвентаризация не найдена"),
    PHARM_INVENTORY_COUNTED_NEGATIVE(HttpStatus.BAD_REQUEST, "Фактическое количество не может быть отрицательным"),
    PHARM_INVENTORY_STORE_REQUIRED(HttpStatus.BAD_REQUEST, "Укажите магазин");

    private final HttpStatus status;
    private final String message;

    PharmacyInventoryErrors(HttpStatus status, String message) {
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

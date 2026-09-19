package com.pos.pharmacy.exception.errorcode;

import com.pos.pharmacy.exception.PharmacyErrorCode;
import org.springframework.http.HttpStatus;

public enum PharmacyCommonErrors implements PharmacyErrorCode {
    PHARM_COMPANY_REQUIRED(HttpStatus.BAD_REQUEST, "Не определена компания"),
    PHARM_STORE_REQUIRED(HttpStatus.BAD_REQUEST, "Укажите магазин"),
    PHARM_CASHIER_REQUIRED(HttpStatus.BAD_REQUEST, "Кассир не определён"),
    PHARM_ACCESS_DENIED(HttpStatus.FORBIDDEN, "Нет доступа к документу");

    private final HttpStatus status;
    private final String message;

    PharmacyCommonErrors(HttpStatus status, String message) {
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

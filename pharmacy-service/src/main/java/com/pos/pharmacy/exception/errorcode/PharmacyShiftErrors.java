package com.pos.pharmacy.exception.errorcode;

import com.pos.pharmacy.exception.PharmacyErrorCode;
import org.springframework.http.HttpStatus;

public enum PharmacyShiftErrors implements PharmacyErrorCode {
    PHARM_SHIFT_NOT_OPEN(HttpStatus.BAD_REQUEST, "Смена не открыта. Откройте смену перед продажей."),
    PHARM_SHIFT_NOT_FOUND(HttpStatus.NOT_FOUND, "Смена не найдена"),
    PHARM_SHIFT_WRONG_COMPANY(HttpStatus.BAD_REQUEST, "Смена принадлежит другой компании"),
    PHARM_SHIFT_ALREADY_OPEN(HttpStatus.BAD_REQUEST, "Смена уже открыта"),
    PHARM_SHIFT_ALREADY_CLOSED(HttpStatus.BAD_REQUEST, "Смена уже закрыта"),
    PHARM_SHIFT_CLOSE_FORBIDDEN(HttpStatus.BAD_REQUEST, "Закрыть может только кассир, открывший смену"),
    PHARM_SHIFT_OPENING_CASH_NEGATIVE(HttpStatus.BAD_REQUEST, "Сумма на открытии не может быть отрицательной"),
    PHARM_SHIFT_CLOSING_CASH_NEGATIVE(HttpStatus.BAD_REQUEST, "Сумма на закрытии не может быть отрицательной");

    private final HttpStatus status;
    private final String message;

    PharmacyShiftErrors(HttpStatus status, String message) {
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

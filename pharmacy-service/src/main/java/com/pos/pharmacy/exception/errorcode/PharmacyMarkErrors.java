package com.pos.pharmacy.exception.errorcode;

import com.pos.pharmacy.exception.PharmacyErrorCode;
import org.springframework.http.HttpStatus;

public enum PharmacyMarkErrors implements PharmacyErrorCode {
    PHARM_MARK_EMPTY(HttpStatus.BAD_REQUEST, "Нет кодов маркировки для регистрации"),
    PHARM_MARK_ROW_INCOMPLETE(HttpStatus.BAD_REQUEST, "Строка КМ без товара или кода"),
    PHARM_MARK_INVALID(HttpStatus.BAD_REQUEST, "Некорректный код маркировки"),
    PHARM_MARK_DUPLICATE(HttpStatus.BAD_REQUEST, "В запросе повторён один и тот же код маркировки"),
    PHARM_MARK_DUPLICATE_IN_RECEIPT(HttpStatus.BAD_REQUEST, "В приходе повторён один и тот же код маркировки"),
    PHARM_MARK_DUPLICATE_IN_SALE(HttpStatus.BAD_REQUEST, "В чеке повторён один и тот же код маркировки"),
    PHARM_MARK_ALREADY_ON_STOCK(HttpStatus.BAD_REQUEST, "Код маркировки уже на складе или продан"),
    PHARM_MARK_ALREADY_SOLD(HttpStatus.BAD_REQUEST, "Этот код маркировки уже был продан"),
    PHARM_MARK_TOO_LONG(HttpStatus.BAD_REQUEST, "Код маркировки слишком длинный. Повторите проведение документа.");

    private final HttpStatus status;
    private final String message;

    PharmacyMarkErrors(HttpStatus status, String message) {
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

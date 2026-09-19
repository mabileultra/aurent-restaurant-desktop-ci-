package com.pos.pharmacy.exception.errorcode;

import com.pos.pharmacy.exception.PharmacyErrorCode;
import org.springframework.http.HttpStatus;

public enum PharmacyCatalogErrors implements PharmacyErrorCode {
    PHARM_PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "Товар не найден"),
    PHARM_PRODUCT_NOT_ACTIVE(HttpStatus.BAD_REQUEST, "Товар неактивен"),
    PHARM_PRODUCT_WRONG_COMPANY(HttpStatus.BAD_REQUEST, "Товар не принадлежит компании"),
    PHARM_PRODUCTS_NOT_FOUND(HttpStatus.BAD_REQUEST, "Товары не найдены"),
    PHARM_SKU_EXISTS(HttpStatus.CONFLICT, "SKU уже занят"),
    PHARM_BARCODE_EXISTS(HttpStatus.CONFLICT, "Штрихкод уже используется"),
    PHARM_BARCODE_NOT_FOUND(HttpStatus.NOT_FOUND, "Товар по штрихкоду не найден"),
    PHARM_QTY_MUST_BE_POSITIVE(HttpStatus.BAD_REQUEST, "Количество должно быть больше нуля"),
    PHARM_QTY_MUST_BE_INTEGER(HttpStatus.BAD_REQUEST, "Для этого товара количество указывается целым числом"),
    PHARM_QTY_SCALE(HttpStatus.BAD_REQUEST, "Слишком много знаков после запятой в количестве"),
    PHARM_QTY_MIN(HttpStatus.BAD_REQUEST, "Количество меньше минимального"),
    PHARM_QTY_SERVICE_INTEGER(HttpStatus.BAD_REQUEST, "Для услуги количество указывается целым числом"),
    PHARM_QTY_PIECE_INTEGER(HttpStatus.BAD_REQUEST, "Для штучного товара количество должно быть целым");

    private final HttpStatus status;
    private final String message;

    PharmacyCatalogErrors(HttpStatus status, String message) {
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

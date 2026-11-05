package com.pos.pharmacy.exception.errorcode;

import com.pos.pharmacy.exception.PharmacyErrorCode;
import org.springframework.http.HttpStatus;

public enum PharmacyPriceRegistryErrors implements PharmacyErrorCode {
    PHARM_PRICE_REGISTRY_FETCH_FAILED(HttpStatus.BAD_GATEWAY, "Не удалось скачать реестр предельных цен"),
    PHARM_PRICE_REGISTRY_PARSE_FAILED(HttpStatus.UNPROCESSABLE_ENTITY, "Не удалось разобрать Excel реестра"),
    PHARM_PRICE_REGISTRY_LINK_NOT_FOUND(HttpStatus.NOT_FOUND, "На странице pharm.gov.uz не найдена ссылка на Excel"),
    PHARM_PRICE_REGISTRY_SNAPSHOT_MISSING(HttpStatus.NOT_FOUND, "Снимок реестра не найден"),
    PHARM_PRICE_LIMIT_EXCEEDED(HttpStatus.CONFLICT, "Цена выше государственной предельной розничной");

    private final HttpStatus status;
    private final String message;

    PharmacyPriceRegistryErrors(HttpStatus status, String message) {
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

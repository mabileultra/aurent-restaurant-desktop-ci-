package com.pos.pharmacy.exception.errorcode;

import com.pos.pharmacy.exception.PharmacyErrorCode;
import org.springframework.http.HttpStatus;

public enum PharmacyDrugRegistryErrors implements PharmacyErrorCode {
    PHARM_DRUG_REGISTRY_FETCH_FAILED(HttpStatus.BAD_GATEWAY, "Не удалось скачать государственный реестр лекарств"),
    PHARM_DRUG_REGISTRY_PARSE_FAILED(HttpStatus.UNPROCESSABLE_ENTITY, "Не удалось разобрать Excel реестра лекарств");

    private final HttpStatus status;
    private final String message;

    PharmacyDrugRegistryErrors(HttpStatus status, String message) {
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

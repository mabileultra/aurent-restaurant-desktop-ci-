package com.pos.pharmacy.exception;

import org.springframework.http.HttpStatus;

/** Стабильный код ошибки pharmacy-service. Имя enum = поле {@code code} в API. */
public interface PharmacyErrorCode {

    String name();

    HttpStatus status();

    String message();
}

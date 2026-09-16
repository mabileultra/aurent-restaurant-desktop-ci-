package com.pos.pharmacy.exception;

import org.springframework.http.HttpStatus;

import java.util.Map;

public class BusinessException extends PharmacyException {

    public BusinessException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }

    public BusinessException(String message, Map<String, Object> context) {
        super(HttpStatus.BAD_REQUEST, message, context);
    }
}

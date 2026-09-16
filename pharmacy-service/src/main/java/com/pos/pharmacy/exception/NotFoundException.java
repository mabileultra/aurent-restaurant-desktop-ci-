package com.pos.pharmacy.exception;

import org.springframework.http.HttpStatus;

import java.util.Map;

public class NotFoundException extends PharmacyException {

    public NotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }

    public NotFoundException(String message, Map<String, Object> context) {
        super(HttpStatus.NOT_FOUND, message, context);
    }
}

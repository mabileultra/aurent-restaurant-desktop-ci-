package com.pos.crm.exception;

import org.springframework.http.HttpStatus;

public class BadRequestException extends CrmException {

    public BadRequestException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}

package com.pos.identity.exception;

import org.springframework.http.HttpStatus;

public class BadRequestException extends IdentityException {

    public BadRequestException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}

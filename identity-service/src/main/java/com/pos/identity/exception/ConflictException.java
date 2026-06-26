package com.pos.identity.exception;

import org.springframework.http.HttpStatus;

public class ConflictException extends IdentityException {

    public ConflictException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}

package com.pos.identity.exception;

import org.springframework.http.HttpStatus;

public class UnauthorizedException extends IdentityException {

    public UnauthorizedException(String message) {
        super(HttpStatus.UNAUTHORIZED, message);
    }
}

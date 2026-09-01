package com.pos.identity.exception;

import org.springframework.http.HttpStatus;

public class TooManyRequestsException extends IdentityException {

    public TooManyRequestsException(String message) {
        super(HttpStatus.TOO_MANY_REQUESTS, message);
    }
}

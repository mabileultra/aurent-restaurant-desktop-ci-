package com.pos.identity.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends IdentityException {

    public ResourceNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }
}

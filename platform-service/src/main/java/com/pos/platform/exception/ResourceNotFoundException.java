package com.pos.platform.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends PlatformException {

    public ResourceNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }
}

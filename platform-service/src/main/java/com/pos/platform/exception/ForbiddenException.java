package com.pos.platform.exception;

import org.springframework.http.HttpStatus;

public class ForbiddenException extends PlatformException {

    public ForbiddenException(String message) {
        super(HttpStatus.FORBIDDEN, message);
    }
}

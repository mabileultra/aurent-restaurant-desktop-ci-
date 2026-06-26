package com.pos.identity.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.Map;

@Getter
public class IdentityException extends RuntimeException {

    private final HttpStatus status;
    private final Map<String, Object> context;

    protected IdentityException(HttpStatus status, String message) {
        this(status, message, Collections.emptyMap());
    }

    protected IdentityException(HttpStatus status, String message, Map<String, Object> context) {
        super(message);
        this.status = status;
        this.context = context != null ? context : Collections.emptyMap();
    }
}

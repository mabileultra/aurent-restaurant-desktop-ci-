package com.pos.pharmacy.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.Map;

@Getter
public class PharmacyException extends RuntimeException {

    private final HttpStatus status;
    private final Map<String, Object> context;

    protected PharmacyException(HttpStatus status, String message) {
        this(status, message, Collections.emptyMap());
    }

    protected PharmacyException(HttpStatus status, String message, Map<String, Object> context) {
        super(message);
        this.status = status;
        this.context = context != null ? context : Collections.emptyMap();
    }
}

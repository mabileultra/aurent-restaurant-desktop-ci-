package com.pos.platform.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.Map;

@Getter
public class PlatformException extends RuntimeException {

    private final HttpStatus status;
    private final Map<String, Object> context;

    protected PlatformException(HttpStatus status, String message) {
        this(status, message, Collections.emptyMap());
    }

    protected PlatformException(HttpStatus status, String message, Map<String, Object> context) {
        super(message);
        this.status = status;
        this.context = context != null ? context : Collections.emptyMap();
    }
}

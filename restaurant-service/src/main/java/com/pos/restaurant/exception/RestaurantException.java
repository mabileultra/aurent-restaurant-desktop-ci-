package com.pos.restaurant.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.Map;

@Getter
public class RestaurantException extends RuntimeException {

    private final HttpStatus status;
    private final Map<String, Object> context;

    protected RestaurantException(HttpStatus status, String message) {
        this(status, message, Collections.emptyMap());
    }

    protected RestaurantException(HttpStatus status, String message, Map<String, Object> context) {
        super(message);
        this.status = status;
        this.context = context != null ? context : Collections.emptyMap();
    }
}

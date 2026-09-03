package com.pos.restaurant.exception;

import org.springframework.http.HttpStatus;

public class ValidationException extends RestaurantException {

    public ValidationException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}

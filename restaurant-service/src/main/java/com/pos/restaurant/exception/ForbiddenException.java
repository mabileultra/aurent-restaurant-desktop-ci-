package com.pos.restaurant.exception;

import org.springframework.http.HttpStatus;

public class ForbiddenException extends RestaurantException {

    public ForbiddenException(String message) {
        super(HttpStatus.FORBIDDEN, message);
    }
}

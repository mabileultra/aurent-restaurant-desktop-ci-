package com.pos.restaurant.exception;

import org.springframework.http.HttpStatus;

public class NotFoundException extends RestaurantException {

    public NotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }
}

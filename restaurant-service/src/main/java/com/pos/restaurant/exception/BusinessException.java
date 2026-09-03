package com.pos.restaurant.exception;

import org.springframework.http.HttpStatus;

public class BusinessException extends RestaurantException {

    public BusinessException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}

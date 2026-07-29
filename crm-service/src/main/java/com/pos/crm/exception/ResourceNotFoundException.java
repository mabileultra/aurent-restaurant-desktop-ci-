package com.pos.crm.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends CrmException {

    public ResourceNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }
}

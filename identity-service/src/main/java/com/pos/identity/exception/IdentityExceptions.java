package com.pos.identity.exception;

import org.springframework.http.HttpStatus;

public final class IdentityExceptions {

    private IdentityExceptions() {
    }

    public static BadRequestException badRequest(String message) {
        return new BadRequestException(message);
    }

    public static ResourceNotFoundException notFound(String entity, Object id) {
        return new ResourceNotFoundException(entity + " not found: " + id);
    }
}

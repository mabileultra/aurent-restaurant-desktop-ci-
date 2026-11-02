package com.pos.catalog.exception;

import org.springframework.http.HttpStatus;

public final class CatalogExceptions {

    private CatalogExceptions() {
    }

    public static CatalogException badRequest(String message) {
        return new CatalogException(HttpStatus.BAD_REQUEST, message);
    }

    public static CatalogException notFound(String message) {
        return new CatalogException(HttpStatus.NOT_FOUND, message);
    }

    public static CatalogException conflict(String message) {
        return new CatalogException(HttpStatus.CONFLICT, message);
    }
}

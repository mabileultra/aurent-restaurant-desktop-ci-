package com.pos.pharmacy.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.Map;

@Getter
public class PharmacyException extends RuntimeException {

    private final PharmacyErrorCode errorCode;
    private final HttpStatus status;
    private final Map<String, Object> context;

    protected PharmacyException(PharmacyErrorCode errorCode) {
        this(errorCode, errorCode.message(), Map.of());
    }

    protected PharmacyException(PharmacyErrorCode errorCode, Map<String, Object> context) {
        this(errorCode, errorCode.message(), context);
    }

    protected PharmacyException(PharmacyErrorCode errorCode, String message) {
        this(errorCode, message, Map.of());
    }

    protected PharmacyException(PharmacyErrorCode errorCode, String message, Map<String, Object> context) {
        super(message);
        this.errorCode = errorCode;
        this.status = errorCode.status();
        this.context = context == null || context.isEmpty() ? Map.of() : Map.copyOf(context);
    }

    public String getCode() {
        return errorCode.name();
    }
}

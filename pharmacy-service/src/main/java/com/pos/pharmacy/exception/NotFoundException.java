package com.pos.pharmacy.exception;

import java.util.Map;

public class NotFoundException extends PharmacyException {

    public NotFoundException(PharmacyErrorCode errorCode) {
        super(errorCode);
    }

    public NotFoundException(PharmacyErrorCode errorCode, String message, Map<String, Object> context) {
        super(errorCode, message, context);
    }
}

package com.pos.pharmacy.exception;

import java.util.Map;

public class BusinessException extends PharmacyException {

    public BusinessException(PharmacyErrorCode errorCode) {
        super(errorCode);
    }

    public BusinessException(PharmacyErrorCode errorCode, Map<String, Object> context) {
        super(errorCode, context);
    }

    public BusinessException(PharmacyErrorCode errorCode, String message) {
        super(errorCode, message);
    }

    public BusinessException(PharmacyErrorCode errorCode, String message, Map<String, Object> context) {
        super(errorCode, message, context);
    }
}

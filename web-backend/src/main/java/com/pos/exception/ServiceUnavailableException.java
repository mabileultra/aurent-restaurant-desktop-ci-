package com.pos.exception;

import com.pos.shared.api.ErrorCode;

import java.util.Map;

public class ServiceUnavailableException extends PosException {

    public ServiceUnavailableException(String message) {
        super(ErrorCode.SERVICE_UNAVAILABLE, message);
    }

    public ServiceUnavailableException(String message, Map<String, Object> context) {
        super(ErrorCode.SERVICE_UNAVAILABLE, message, context);
    }

    public ServiceUnavailableException(String message, Throwable cause) {
        super(ErrorCode.SERVICE_UNAVAILABLE, message, cause);
    }
}

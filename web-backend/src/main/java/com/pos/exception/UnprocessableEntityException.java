package com.pos.exception;

import com.pos.shared.api.ErrorCode;

import java.util.Map;

public class UnprocessableEntityException extends PosException {

    public UnprocessableEntityException(String message) {
        super(ErrorCode.UNPROCESSABLE_ENTITY, message);
    }

    public UnprocessableEntityException(String message, Map<String, Object> context) {
        super(ErrorCode.UNPROCESSABLE_ENTITY, message, context);
    }
}

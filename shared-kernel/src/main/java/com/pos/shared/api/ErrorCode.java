package com.pos.shared.api;

/**
 * Стабильный код ошибки для API и логов (не менять имена без необходимости).
 */
public enum ErrorCode {
    BAD_REQUEST,
    NOT_FOUND,
    CONFLICT,
    VALIDATION_FAILED,
    UNAUTHORIZED,
    FORBIDDEN,
    FILE_UPLOAD_ERROR,
    INTERNAL_ERROR,
    SERVICE_UNAVAILABLE;

    public static ErrorCode fromHttpStatusCode(int status) {
        return switch (status) {
            case 400 -> BAD_REQUEST;
            case 401 -> UNAUTHORIZED;
            case 403 -> FORBIDDEN;
            case 404 -> NOT_FOUND;
            case 409 -> CONFLICT;
            case 503 -> SERVICE_UNAVAILABLE;
            default -> INTERNAL_ERROR;
        };
    }
}

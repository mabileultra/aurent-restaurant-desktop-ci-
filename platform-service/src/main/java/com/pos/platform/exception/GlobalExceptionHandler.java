package com.pos.platform.exception;

import com.pos.shared.api.ApiErrorResponse;
import com.pos.shared.api.ErrorCode;
import com.pos.shared.log.LogUtil;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CallNotPermittedException.class)
    public ResponseEntity<ApiErrorResponse> handleCircuitOpen(CallNotPermittedException ex, HttpServletRequest req) {
        String message = "POS core is temporarily unavailable, try again shortly";
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
            ApiErrorResponse.of(
                HttpStatus.SERVICE_UNAVAILABLE.value(),
                ErrorCode.SERVICE_UNAVAILABLE,
                message,
                req.getRequestURI(),
                null
            )
        );
    }

    @ExceptionHandler(PlatformException.class)
    public ResponseEntity<ApiErrorResponse> handlePlatform(PlatformException ex, HttpServletRequest req) {
        int status = ex.getStatus().value();
        return ResponseEntity.status(status).body(
            ApiErrorResponse.of(
                status,
                ErrorCode.fromHttpStatusCode(status),
                ex.getMessage(),
                req.getRequestURI(),
                ex.getContext()
            )
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(err -> err.getField() + ": " + err.getDefaultMessage())
            .orElse("Validation error");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ApiErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                ErrorCode.VALIDATION_FAILED,
                message,
                req.getRequestURI(),
                null
            )
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception ex, HttpServletRequest req) {
        LogUtil.error(GlobalExceptionHandler.class, "Unhandled platform error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            ApiErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                ErrorCode.INTERNAL_ERROR,
                ex.getMessage() != null ? ex.getMessage() : "Internal error",
                req.getRequestURI(),
                null
            )
        );
    }
}

package com.pos.restaurant.exception;

import com.pos.shared.api.ApiErrorResponse;
import com.pos.shared.api.ErrorCode;
import com.pos.shared.log.LogUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RestaurantException.class)
    public ResponseEntity<ApiErrorResponse> handleRestaurant(RestaurantException ex, HttpServletRequest req) {
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

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            ApiErrorResponse.of(
                HttpStatus.FORBIDDEN.value(),
                ErrorCode.FORBIDDEN,
                "Access denied",
                req.getRequestURI(),
                null
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
        LogUtil.error(GlobalExceptionHandler.class, "Unhandled restaurant error", ex);
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

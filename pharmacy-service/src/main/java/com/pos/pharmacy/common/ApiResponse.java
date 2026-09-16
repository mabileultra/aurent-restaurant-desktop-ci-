package com.pos.pharmacy.common;

public record ApiResponse(String message) {
    public static ApiResponse success(String message) {
        return new ApiResponse(message);
    }
}

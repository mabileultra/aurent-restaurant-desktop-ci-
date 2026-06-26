package com.pos.identity.service;

import com.pos.identity.dto.auth.AuthRequest;
import com.pos.identity.dto.auth.AuthResponse;
import com.pos.identity.dto.auth.CashierPinAuthRequest;
import com.pos.identity.dto.auth.RegisterRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse authenticate(AuthRequest request, String clientIp, String userAgent);

    AuthResponse authenticateCashierPin(CashierPinAuthRequest request);

    void verifyPassword(String password);

    void verifyPin(String pin);

    AuthResponse refreshToken(String token);
}

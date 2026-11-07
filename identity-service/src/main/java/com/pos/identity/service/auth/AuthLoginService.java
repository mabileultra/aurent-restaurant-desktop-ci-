package com.pos.identity.service.auth;

import com.pos.identity.dto.auth.AuthRequest;
import com.pos.identity.dto.auth.AuthResponse;
import com.pos.identity.dto.auth.RegisterRequest;
import com.pos.identity.dto.auth.TwoFactorVerifyRequest;

public interface AuthLoginService {

    AuthResponse register(RegisterRequest request);

    AuthResponse authenticate(AuthRequest request, String clientIp, String userAgent);

    AuthResponse verifyTwoFactor(TwoFactorVerifyRequest request, String clientIp, String userAgent);

    void verifyPassword(String password);
}

package com.pos.identity.service.auth;

import com.pos.identity.dto.auth.AuthResponse;

public interface TokenRefreshService {

    AuthResponse refresh(String token);
}

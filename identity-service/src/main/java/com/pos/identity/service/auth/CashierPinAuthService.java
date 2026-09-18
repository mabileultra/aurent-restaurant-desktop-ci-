package com.pos.identity.service.auth;

import com.pos.identity.dto.auth.AuthResponse;
import com.pos.identity.dto.auth.CashierPinAuthRequest;

public interface CashierPinAuthService {

    AuthResponse authenticate(CashierPinAuthRequest request);

    void verifyPin(String pin);
}

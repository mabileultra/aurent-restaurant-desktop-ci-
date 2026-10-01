package com.pos.identity.service.auth;

import com.pos.identity.dto.auth.AuthResponse;
import com.pos.identity.dto.auth.CashierPinAuthRequest;
import com.pos.identity.dto.auth.PinRosterEntryResponse;

import java.util.List;

public interface CashierPinAuthService {

    AuthResponse authenticate(CashierPinAuthRequest request);

    List<PinRosterEntryResponse> listPinRoster(String companyLoginCode);

    void verifyPin(String pin);
}

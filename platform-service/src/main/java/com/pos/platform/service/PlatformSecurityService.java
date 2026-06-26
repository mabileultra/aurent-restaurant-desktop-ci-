package com.pos.platform.service;

import com.pos.platform.dto.platform.security.CashierServerPasswordStatusResponse;
import com.pos.platform.dto.platform.security.UpdateCashierServerPasswordRequest;
import com.pos.platform.dto.platform.security.VerifyCashierServerPasswordResponse;

public interface PlatformSecurityService {

    CashierServerPasswordStatusResponse getCashierServerPasswordStatus();

    CashierServerPasswordStatusResponse updateCashierServerPassword(UpdateCashierServerPasswordRequest request);

    VerifyCashierServerPasswordResponse verifyCashierServerPassword(String password);
}

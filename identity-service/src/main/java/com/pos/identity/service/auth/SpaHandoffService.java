package com.pos.identity.service.auth;

import com.pos.identity.dto.auth.AuthResponse;
import com.pos.identity.dto.auth.HandoffCodeResponse;
import com.pos.identity.dto.auth.SpaAudience;

public interface SpaHandoffService {

    HandoffCodeResponse create(SpaAudience audience);

    AuthResponse exchange(String code);
}

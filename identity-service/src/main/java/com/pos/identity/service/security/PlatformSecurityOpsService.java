package com.pos.identity.service.security;

import com.pos.identity.dto.security.AuthSessionResponse;
import com.pos.identity.dto.security.LoginRulesDto;
import com.pos.identity.dto.security.ReauthRequest;
import com.pos.identity.dto.security.ReauthResponse;
import com.pos.identity.dto.security.TwoFactorSetupResponse;

import java.util.List;
import java.util.UUID;

public interface PlatformSecurityOpsService {

    List<AuthSessionResponse> listSessions();

    void revokeSession(UUID sessionId);

    int revokeOtherSessions();

    LoginRulesDto getLoginRules();

    LoginRulesDto saveLoginRules(LoginRulesDto rules, String sudoToken);

    ReauthResponse reauth(ReauthRequest request);

    TwoFactorSetupResponse setupTwoFactor();

    TwoFactorSetupResponse enableTwoFactor(String code);

    TwoFactorSetupResponse disableTwoFactor(String password, String code);

    TwoFactorSetupResponse twoFactorStatus();
}

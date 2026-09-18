package com.pos.identity.service.auth.impl;

import com.pos.identity.client.dto.CompanyDto;
import com.pos.identity.dto.auth.AuthResponse;
import com.pos.identity.dto.auth.CashierPinAuthRequest;
import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.repository.spec.UserSpecifications;
import com.pos.identity.security.CurrentUserProvider;
import com.pos.identity.security.JwtService;
import com.pos.identity.security.PinSecret;
import com.pos.identity.service.auth.CashierPinAuthService;
import com.pos.identity.service.auth.support.AuthResponseFactory;
import com.pos.identity.service.auth.support.LoginAuditPublisher;
import com.pos.identity.service.auth.support.LoginGuard;
import com.pos.identity.service.support.TenantAccessSupport;
import com.pos.identity.service.support.UserLookupSupport;
import com.pos.identity.service.support.UserSyncSupport;
import com.pos.identity.util.CashierPinUtil;
import com.pos.identity.util.CompanyLoginCodeUtil;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class CashierPinAuthServiceImpl implements CashierPinAuthService {

    private final UserLookupSupport userLookup;
    private final TenantAccessSupport tenantAccess;
    private final JwtService jwtService;
    private final PinSecret pinSecret;
    private final CurrentUserProvider currentUserProvider;
    private final UserSyncSupport userSyncSupport;
    private final LoginGuard loginGuard;
    private final LoginAuditPublisher loginAuditPublisher;
    private final AuthResponseFactory authResponseFactory;

    @Override
    @Transactional(readOnly = true)
    public AuthResponse authenticate(CashierPinAuthRequest request) {
        String companyCode = CompanyLoginCodeUtil.normalize(request.companyLoginCode());
        String pin = CashierPinUtil.normalizePin(request.pin());
        if (pin.length() < 4 || pin.length() > 6) {
            throw new BadRequestException("Invalid PIN");
        }

        CompanyDto company = tenantAccess.requireCompanyByLoginCode(companyCode);
        if (!company.active()) {
            throw new BadRequestException("Company is inactive");
        }

        String digest = CashierPinUtil.digestHex(pin, pinSecret.value());
        User user = userLookup.findOneWithDetails(
                UserSpecifications.lookup()
                    .companyId(company.id())
                    .roleName("CASHIER")
                    .activeOnly()
                    .pinDigest(digest)
            )
            .orElseThrow(() -> new BadRequestException("Invalid PIN"));
        loginGuard.assertAllowed(user, company);

        userSyncSupport.syncUpdate(user);

        String token = jwtService.generateToken(user);
        loginAuditPublisher.publish(user, "LOGIN_PIN", null, null);
        LogUtil.info(CashierPinAuthServiceImpl.class, "Cashier PIN authenticated: userId={}, companyId={}", user.getId(), company.id());
        return authResponseFactory.build(user, token, company.loginCode());
    }

    @Override
    @Transactional(readOnly = true)
    public void verifyPin(String pin) {
        User user = currentUserProvider.requireCurrentUser();
        String normalized = CashierPinUtil.normalizePin(pin);
        if (normalized.length() < 4 || normalized.length() > 6) {
            throw new BadRequestException("Invalid PIN");
        }
        if (!StringUtils.hasText(user.getPinDigest())) {
            throw new BadRequestException("PIN is not configured");
        }
        String digest = CashierPinUtil.digestHex(normalized, pinSecret.value());
        if (!digest.equalsIgnoreCase(user.getPinDigest())) {
            throw new BadRequestException("Invalid PIN");
        }
    }
}

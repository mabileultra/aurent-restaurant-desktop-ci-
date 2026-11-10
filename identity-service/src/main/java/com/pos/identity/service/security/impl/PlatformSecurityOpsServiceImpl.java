package com.pos.identity.service.security.impl;

import com.pos.identity.dto.security.AuthSessionResponse;
import com.pos.identity.dto.security.LoginRulesDto;
import com.pos.identity.dto.security.ReauthRequest;
import com.pos.identity.dto.security.ReauthResponse;
import com.pos.identity.dto.security.TwoFactorSetupResponse;
import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.security.CurrentUserProvider;
import com.pos.identity.security.IdentityTenantContext;
import com.pos.identity.security.JwtService;
import com.pos.identity.service.security.PlatformSecurityOpsService;
import com.pos.identity.service.security.support.AuthSessionSupport;
import com.pos.identity.service.security.support.LoginRulesSupport;
import com.pos.identity.service.security.support.TotpSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PlatformSecurityOpsServiceImpl implements PlatformSecurityOpsService {

    private static final long SUDO_TTL_MS = 5 * 60 * 1000L;
    private static final long SUDO_TTL_SECONDS = SUDO_TTL_MS / 1000L;

    private final AuthSessionSupport authSessionSupport;
    private final LoginRulesSupport loginRulesSupport;
    private final TotpSupport totpSupport;
    private final CurrentUserProvider currentUserProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    @Transactional(readOnly = true)
    public List<AuthSessionResponse> listSessions() {
        return authSessionSupport.listPlatformSessions(IdentityTenantContext.sessionId());
    }

    @Override
    @Transactional
    public void revokeSession(UUID sessionId) {
        authSessionSupport.revoke(sessionId, currentUserProvider.requireCurrentUser().getId());
    }

    @Override
    @Transactional
    public int revokeOtherSessions() {
        User me = currentUserProvider.requireCurrentUser();
        return authSessionSupport.revokeOthers(me.getId(), IdentityTenantContext.sessionId());
    }

    @Override
    @Transactional(readOnly = true)
    public LoginRulesDto getLoginRules() {
        return loginRulesSupport.get();
    }

    @Override
    @Transactional
    public LoginRulesDto saveLoginRules(LoginRulesDto rules, String sudoToken) {
        requireSudo(sudoToken);
        return loginRulesSupport.save(rules);
    }

    @Override
    @Transactional(readOnly = true)
    public ReauthResponse reauth(ReauthRequest request) {
        User user = currentUserProvider.requireCurrentUser();
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadRequestException("Неверный пароль");
        }
        if (user.isTotpEnabled()) {
            if (!totpSupport.verify(user.getTotpSecret(), request.totpCode())) {
                throw new BadRequestException("Неверный код 2FA");
            }
        }
        String sudo = jwtService.generatePurposeToken(user, "sudo", SUDO_TTL_MS);
        return new ReauthResponse(sudo, SUDO_TTL_SECONDS);
    }

    @Override
    @Transactional
    public TwoFactorSetupResponse setupTwoFactor() {
        User user = currentUserProvider.requireCurrentUser();
        if (user.isTotpEnabled()) {
            return status(user);
        }
        String secret = totpSupport.generateSecret();
        user.setTotpSecret(secret);
        userRepository.save(user);
        return new TwoFactorSetupResponse(
            secret,
            totpSupport.otpAuthUrl(secret, user.getEmail(), "Aurent POS"),
            false
        );
    }

    @Override
    @Transactional
    public TwoFactorSetupResponse enableTwoFactor(String code) {
        User user = currentUserProvider.requireCurrentUser();
        if (!StringUtils.hasText(user.getTotpSecret())) {
            throw new BadRequestException("Сначала получите секрет через setup");
        }
        if (!totpSupport.verify(user.getTotpSecret(), code)) {
            throw new BadRequestException("Неверный код 2FA");
        }
        user.setTotpEnabled(true);
        userRepository.save(user);
        return status(user);
    }

    @Override
    @Transactional
    public TwoFactorSetupResponse disableTwoFactor(String password, String code) {
        User user = currentUserProvider.requireCurrentUser();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BadRequestException("Неверный пароль");
        }
        if (user.isTotpEnabled() && !totpSupport.verify(user.getTotpSecret(), code)) {
            throw new BadRequestException("Неверный код 2FA");
        }
        user.setTotpEnabled(false);
        user.setTotpSecret(null);
        userRepository.save(user);
        return status(user);
    }

    @Override
    @Transactional(readOnly = true)
    public TwoFactorSetupResponse twoFactorStatus() {
        return status(currentUserProvider.requireCurrentUser());
    }

    private void requireSudo(String sudoToken) {
        if (!StringUtils.hasText(sudoToken)
            || !"sudo".equals(jwtService.extractPurpose(sudoToken))
            || !jwtService.isTokenValid(sudoToken)) {
            throw new BadRequestException("Требуется повторное подтверждение (sudo)");
        }
        UUID sudoUser = jwtService.extractSubjectUserId(sudoToken);
        UUID current = currentUserProvider.requireCurrentUser().getId();
        if (!current.equals(sudoUser)) {
            throw new BadRequestException("Sudo-токен принадлежит другому пользователю");
        }
    }

    private TwoFactorSetupResponse status(User user) {
        String url = null;
        if (StringUtils.hasText(user.getTotpSecret()) && !user.isTotpEnabled()) {
            url = totpSupport.otpAuthUrl(user.getTotpSecret(), user.getEmail(), "Aurent POS");
        }
        return new TwoFactorSetupResponse(
            user.isTotpEnabled() ? null : user.getTotpSecret(),
            url,
            user.isTotpEnabled()
        );
    }
}

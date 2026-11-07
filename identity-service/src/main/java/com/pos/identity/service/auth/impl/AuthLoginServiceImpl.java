package com.pos.identity.service.auth.impl;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.client.dto.CompanyDto;
import com.pos.identity.client.dto.SuperAdminLoginEmailRequest;
import com.pos.identity.dto.auth.AuthRequest;
import com.pos.identity.dto.auth.AuthResponse;
import com.pos.identity.dto.auth.RegisterRequest;
import com.pos.identity.dto.auth.TwoFactorVerifyRequest;
import com.pos.identity.dto.security.LoginRulesDto;
import com.pos.identity.entity.AuthSession;
import com.pos.identity.entity.Role;
import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.repository.RoleRepository;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.repository.spec.UserSpecifications;
import com.pos.identity.security.CurrentUserProvider;
import com.pos.identity.security.JwtService;
import com.pos.identity.security.RoleName;
import com.pos.identity.service.auth.AuthLoginService;
import com.pos.identity.service.auth.support.AuthResponseFactory;
import com.pos.identity.service.auth.support.LoginAuditPublisher;
import com.pos.identity.service.auth.support.LoginGuard;
import com.pos.identity.service.security.support.AuthSessionSupport;
import com.pos.identity.service.security.support.IpAllowlistMatcher;
import com.pos.identity.service.security.support.LoginLockSupport;
import com.pos.identity.service.security.support.LoginRulesSupport;
import com.pos.identity.service.security.support.TotpSupport;
import com.pos.identity.service.support.TenantAccessSupport;
import com.pos.identity.service.support.UserLookupSupport;
import com.pos.identity.service.support.UserSyncSupport;
import com.pos.identity.util.CompanyLoginCodeUtil;
import com.pos.identity.util.EmailAddressRules;
import com.pos.identity.util.UserLoginUtil;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AuthLoginServiceImpl implements AuthLoginService {

    private static final long CHALLENGE_TTL_MS = 5 * 60 * 1000L;

    private final UserRepository userRepository;
    private final UserLookupSupport userLookup;
    private final TenantAccessSupport tenantAccess;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PosCoreClient posCoreClient;
    private final CurrentUserProvider currentUserProvider;
    private final UserSyncSupport userSyncSupport;
    private final LoginGuard loginGuard;
    private final LoginAuditPublisher loginAuditPublisher;
    private final AuthResponseFactory authResponseFactory;
    private final LoginRulesSupport loginRulesSupport;
    private final LoginLockSupport loginLockSupport;
    private final IpAllowlistMatcher ipAllowlistMatcher;
    private final AuthSessionSupport authSessionSupport;
    private final TotpSupport totpSupport;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String username = UserLoginUtil.normalizeUsername(request.username());
        if (userLookup.exists(UserSpecifications.lookup().platformOnly().usernameIgnoreCase(username))) {
            throw new BadRequestException("Username already taken");
        }
        String email = EmailAddressRules.require(request.email());
        if (userLookup.exists(UserSpecifications.lookup().platformOnly().emailIgnoreCase(email))) {
            throw new BadRequestException("Email already registered");
        }

        Role role = roleRepository.findByName("CASHIER")
            .orElseThrow(() -> new IllegalStateException("Default role not found"));

        User user = User.builder()
            .username(username)
            .email(email)
            .password(passwordEncoder.encode(request.password()))
            .fullName(request.fullName())
            .role(role)
            .isActive(true)
            .build();

        userRepository.save(user);
        userSyncSupport.syncCreate(user);
        loginAuditPublisher.publish(user, "USER_REGISTERED", "User", user.getId().toString());

        AuthSession session = authSessionSupport.open(user, null, null);
        String token = jwtService.generateToken(user, session.getId());
        LogUtil.info(AuthLoginServiceImpl.class, "User registered: username={}", user.getUsername());
        return authResponseFactory.build(user, token, null);
    }

    @Override
    @Transactional
    public AuthResponse authenticate(AuthRequest request, String clientIp, String userAgent) {
        LoginRulesDto rules = loginRulesSupport.get();
        if (!ipAllowlistMatcher.isAllowed(rules, clientIp)) {
            throw new BadRequestException("Вход с этого IP запрещён правилами безопасности");
        }

        String username = UserLoginUtil.normalizeUsername(request.username());
        String companyCode = CompanyLoginCodeUtil.normalize(request.companyLoginCode());

        CompanyDto company = null;
        User user;
        if (StringUtils.hasText(companyCode)) {
            company = tenantAccess.requireCompanyByLoginCode(companyCode);
            user = userLookup.findOneWithDetails(
                    UserSpecifications.lookup().companyId(company.id()).usernameIgnoreCase(username)
                )
                .orElseThrow(() -> new BadRequestException("Invalid username or password"));
        } else {
            user = userLookup.findOneWithDetails(
                    UserSpecifications.lookup().platformOnly().usernameIgnoreCase(username)
                )
                .or(() -> userLookup.findOneWithDetails(
                    UserSpecifications.lookup().tenantOnly().usernameIgnoreCase(username)
                ))
                .orElseThrow(() -> new BadRequestException("Invalid username or password"));
        }

        loginGuard.assertAllowed(user, company);
        loginLockSupport.assertNotLocked(user);

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            loginLockSupport.onFailure(user, rules);
            throw new BadRequestException("Invalid username or password");
        }

        String roleName = user.getRole() != null ? user.getRole().getName() : null;
        boolean needTotp = loginRulesSupport.requiresTotp(rules, roleName) || user.isTotpEnabled();
        if (needTotp) {
            if (!user.isTotpEnabled() || !StringUtils.hasText(user.getTotpSecret())) {
                throw new BadRequestException("Для этой роли включён 2FA. Сначала настройте Authenticator.");
            }
            String challenge = jwtService.generatePurposeToken(user, "2fa_challenge", CHALLENGE_TTL_MS);
            return authResponseFactory.challenge(user, challenge);
        }

        return completeLogin(user, company, clientIp, userAgent, rules);
    }

    @Override
    @Transactional
    public AuthResponse verifyTwoFactor(TwoFactorVerifyRequest request, String clientIp, String userAgent) {
        if (!"2fa_challenge".equals(jwtService.extractPurpose(request.challengeToken()))
            || !jwtService.isTokenValid(request.challengeToken())) {
            throw new BadRequestException("Недействительный или истёкший 2FA-челлендж");
        }
        User user = userRepository.findByIdWithDetails(jwtService.extractSubjectUserId(request.challengeToken()))
            .orElseThrow(() -> new BadRequestException("User not found"));
        loginLockSupport.assertNotLocked(user);
        if (!totpSupport.verify(user.getTotpSecret(), request.code())) {
            loginLockSupport.onFailure(user, loginRulesSupport.get());
            throw new BadRequestException("Неверный код 2FA");
        }
        LoginRulesDto rules = loginRulesSupport.get();
        if (!ipAllowlistMatcher.isAllowed(rules, clientIp)) {
            throw new BadRequestException("Вход с этого IP запрещён правилами безопасности");
        }
        CompanyDto company = user.getCompanyId() != null
            ? posCoreClient.getCompanyById(user.getCompanyId())
            : null;
        return completeLogin(user, company, clientIp, userAgent, rules);
    }

    private AuthResponse completeLogin(
        User user,
        CompanyDto company,
        String clientIp,
        String userAgent,
        LoginRulesDto rules
    ) {
        loginLockSupport.onSuccess(user);
        loginAuditPublisher.publish(user, "LOGIN", null, null);

        if (RoleName.SUPER_ADMIN.matches(user)) {
            posCoreClient.notifySuperAdminLogin(new SuperAdminLoginEmailRequest(
                user.getId().toString(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                clientIp,
                userAgent
            ));
        } else {
            userSyncSupport.syncUpdate(user);
        }

        AuthSession session = authSessionSupport.open(user, clientIp, userAgent);
        authSessionSupport.enforceConcurrentLimit(user.getId(), session.getId(), rules.conc());
        String token = jwtService.generateToken(user, session.getId());
        LogUtil.info(
            AuthLoginServiceImpl.class,
            "User authenticated: username={}, companyId={}",
            user.getUsername(),
            user.getCompanyId()
        );
        return authResponseFactory.build(user, token, company != null ? company.loginCode() : null);
    }

    @Override
    @Transactional(readOnly = true)
    public void verifyPassword(String password) {
        User user = currentUserProvider.requireCurrentUser();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BadRequestException("Invalid password");
        }
    }
}

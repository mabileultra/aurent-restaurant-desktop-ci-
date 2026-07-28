package com.pos.identity.service.impl;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.client.dto.AuditRequest;
import com.pos.identity.client.dto.CompanyDto;
import com.pos.identity.client.dto.SuperAdminLoginEmailRequest;
import com.pos.identity.dto.auth.AuthRequest;
import com.pos.identity.dto.auth.AuthResponse;
import com.pos.identity.dto.auth.CashierPinAuthRequest;
import com.pos.identity.dto.auth.RegisterRequest;
import com.pos.identity.entity.Role;
import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.mapper.AuthMapper;
import com.pos.identity.repository.RoleRepository;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.repository.spec.UserSpecifications;
import com.pos.identity.security.CurrentUserProvider;
import com.pos.identity.security.JwtService;
import com.pos.identity.security.RoleName;
import com.pos.identity.service.AuthService;
import com.pos.identity.service.ModuleAccessService;
import com.pos.identity.service.support.UserLookupSupport;
import com.pos.identity.service.support.TenantAccessSupport;
import com.pos.identity.service.support.UserSyncSupport;
import com.pos.identity.util.CashierPinUtil;
import com.pos.identity.util.CompanyLoginCodeUtil;
import com.pos.shared.log.LogUtil;
import com.pos.identity.util.UserLoginUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserLookupSupport userLookup;
    private final TenantAccessSupport tenantAccess;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PosCoreClient posCoreClient;
    private final AuthMapper authMapper;
    private final ModuleAccessService moduleAccessService;
    private final CurrentUserProvider currentUserProvider;
    private final UserSyncSupport userSyncSupport;

    @Value("${app.jwt.secret}")
    private String pinSecret;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String username = UserLoginUtil.normalizeUsername(request.username());
        if (userLookup.exists(UserSpecifications.lookup().platformOnly().usernameIgnoreCase(username))) {
            throw new BadRequestException("Username already taken");
        }
        if (userLookup.exists(
            UserSpecifications.lookup().platformOnly().emailIgnoreCase(UserLoginUtil.normalizeEmail(request.email()))
        )) {
            throw new BadRequestException("Email already registered");
        }

        Role role = roleRepository.findByName("CASHIER")
            .orElseThrow(() -> new IllegalStateException("Default role not found"));

        User user = User.builder()
            .username(username)
            .email(UserLoginUtil.normalizeEmail(request.email()))
            .password(passwordEncoder.encode(request.password()))
            .fullName(request.fullName())
            .role(role)
            .isActive(true)
            .build();

        userRepository.save(user);
        userSyncSupport.syncCreate(user);
        audit(user, "USER_REGISTERED", "User", user.getId().toString());

        String token = jwtService.generateToken(user);
        LogUtil.info(AuthServiceImpl.class, "User registered: username={}", user.getUsername());
        return buildResponse(user, token, null);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse authenticate(AuthRequest request, String clientIp, String userAgent) {
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

        assertLoginAllowed(user, company);

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadRequestException("Invalid username or password");
        }

        audit(user, "LOGIN", null, null);

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

        String token = jwtService.generateToken(user);
        LogUtil.info(
            AuthServiceImpl.class,
            "User authenticated: username={}, companyId={}",
            user.getUsername(),
            user.getCompanyId()
        );
        return buildResponse(user, token, company != null ? company.loginCode() : null);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse authenticateCashierPin(CashierPinAuthRequest request) {
        String companyCode = CompanyLoginCodeUtil.normalize(request.companyLoginCode());
        String pin = CashierPinUtil.normalizePin(request.pin());
        if (pin.length() < 4 || pin.length() > 6) {
            throw new BadRequestException("Invalid PIN");
        }

        CompanyDto company = tenantAccess.requireCompanyByLoginCode(companyCode);
        if (!company.active()) {
            throw new BadRequestException("Company is inactive");
        }

        String digest = CashierPinUtil.digestHex(pin, pinSecret);
        User user = userLookup.findOneWithDetails(
                UserSpecifications.lookup()
                    .companyId(company.id())
                    .roleName("CASHIER")
                    .activeOnly()
                    .pinDigest(digest)
            )
            .orElseThrow(() -> new BadRequestException("Invalid PIN"));
        assertLoginAllowed(user, company);

        userSyncSupport.syncUpdate(user);

        String token = jwtService.generateToken(user);
        audit(user, "LOGIN_PIN", null, null);
        LogUtil.info(AuthServiceImpl.class, "Cashier PIN authenticated: userId={}, companyId={}", user.getId(), company.id());
        return buildResponse(user, token, company.loginCode());
    }

    @Override
    @Transactional(readOnly = true)
    public void verifyPassword(String password) {
        User user = currentUserProvider.requireCurrentUser();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BadRequestException("Invalid password");
        }
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
        String digest = CashierPinUtil.digestHex(normalized, pinSecret);
        if (!digest.equalsIgnoreCase(user.getPinDigest())) {
            throw new BadRequestException("Invalid PIN");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse refreshToken(String token) {
        UUID userId = jwtService.extractSubjectUserId(token);
        User user = userRepository.findByIdWithDetails(userId)
            .orElseThrow(() -> new BadRequestException("User not found"));

        if (!jwtService.isTokenValid(token, user)) {
            throw new BadRequestException("Invalid or expired token");
        }

        if (!RoleName.SUPER_ADMIN.matches(user)) {
            userSyncSupport.syncUpdate(user);
        }

        String newToken = jwtService.generateToken(user);
        return buildResponse(user, newToken, null);
    }

    private static void assertLoginAllowed(User user, CompanyDto company) {
        if (!user.isActive()) {
            throw new BadRequestException("User account is disabled");
        }
        if (RoleName.SUPER_ADMIN.matches(user) && user.getCompanyId() != null) {
            throw new BadRequestException("Invalid username or password");
        }
        if (!RoleName.SUPER_ADMIN.matches(user) && user.getCompanyId() == null) {
            throw new BadRequestException("Invalid username or password");
        }
        if (!RoleName.SUPER_ADMIN.matches(user) && company != null && !company.active()) {
            throw new BadRequestException("Company is inactive");
        }
    }

    private AuthResponse buildResponse(User user, String token, String companyLoginCode) {
        return authMapper.toResponse(
            user,
            token,
            companyLoginCode,
            moduleAccessService.resolveAllowedModuleIds(user),
            user.isModuleAccessCustom()
        );
    }

    private void audit(User user, String action, String entityType, String entityId) {
        posCoreClient.audit(new AuditRequest(
            user.getId().toString(),
            action,
            entityType,
            entityId,
            null,
            null
        ));
    }
}

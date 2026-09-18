package com.pos.identity.service.auth.impl;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.client.dto.CompanyDto;
import com.pos.identity.client.dto.SuperAdminLoginEmailRequest;
import com.pos.identity.dto.auth.AuthRequest;
import com.pos.identity.dto.auth.AuthResponse;
import com.pos.identity.dto.auth.RegisterRequest;
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
import com.pos.identity.service.support.TenantAccessSupport;
import com.pos.identity.service.support.UserLookupSupport;
import com.pos.identity.service.support.UserSyncSupport;
import com.pos.identity.util.CompanyLoginCodeUtil;
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
        loginAuditPublisher.publish(user, "USER_REGISTERED", "User", user.getId().toString());

        String token = jwtService.generateToken(user);
        LogUtil.info(AuthLoginServiceImpl.class, "User registered: username={}", user.getUsername());
        return authResponseFactory.build(user, token, null);
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

        loginGuard.assertAllowed(user, company);

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadRequestException("Invalid username or password");
        }

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

        String token = jwtService.generateToken(user);
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

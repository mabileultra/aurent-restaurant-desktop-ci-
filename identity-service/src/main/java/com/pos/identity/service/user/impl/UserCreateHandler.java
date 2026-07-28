package com.pos.identity.service.user.impl;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.client.dto.UserCredentialsEmailRequest;
import com.pos.identity.dto.user.CreateUserRequest;
import com.pos.identity.dto.user.UserResponse;
import com.pos.identity.entity.Role;
import com.pos.identity.entity.User;
import com.pos.identity.exception.IdentityExceptions;
import com.pos.identity.mapper.UserMapper;
import com.pos.identity.repository.RoleRepository;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.service.support.TenantAccessSupport;
import com.pos.identity.service.support.UserSyncSupport;
import com.pos.identity.service.user.UserPinService;
import com.pos.identity.service.user.support.UserAccessPolicy;
import com.pos.identity.util.DbExceptionTranslator;
import com.pos.shared.log.LogUtil;
import com.pos.identity.util.PersonNameUtil;
import com.pos.identity.util.TextUtil;
import com.pos.identity.util.UserLoginUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserCreateHandler {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final TenantAccessSupport tenantAccess;
    private final UserAccessPolicy accessPolicy;
    private final UserPinService userPinService;
    private final PosCoreClient posCoreClient;
    private final UserMapper userMapper;
    private final UserSyncSupport userSyncSupport;

    @Transactional(rollbackFor = Exception.class)
    public UserResponse create(CreateUserRequest req) {
        Role role = roleRepository.findByName(req.role())
            .orElseThrow(() -> IdentityExceptions.badRequest("Invalid role: " + req.role()));
        accessPolicy.assertRoleAllowedForCreate(role.getName());

        Integer companyId = accessPolicy.resolveCompanyIdForCreate(req.companyId(), role.getName());
        String username = UserLoginUtil.normalizeUsername(req.username());
        String email = UserLoginUtil.normalizeEmail(req.email());
        accessPolicy.assertUsernameAvailable(companyId, username, null);
        accessPolicy.assertEmailAvailable(companyId, email, null);

        UserAccessPolicy.assertCashierStoreAssignment(role.getName(), req.storeIds());
        Set<Integer> storeIds = companyId != null
            ? tenantAccess.resolveStoresForUser(companyId, req.storeIds())
            : Set.of();

        String rawPassword = resolvePasswordForCreate(role.getName(), req.password(), req.pin());
        User user = User.builder()
            .username(username)
            .email(email)
            .password(passwordEncoder.encode(rawPassword))
            .firstName(TextUtil.trimOrNull(req.firstName()))
            .lastName(TextUtil.trimOrNull(req.lastName()))
            .patronymic(TextUtil.trimOrNull(req.patronymic()))
            .fullName(resolveFullName(req))
            .role(role)
            .companyId(companyId)
            .storeIds(new HashSet<>(storeIds))
            .isActive(true)
            .build();
        user.syncFullName();
        userPinService.applyForCreate(user, role.getName(), companyId, req.pin());

        User saved = DbExceptionTranslator.persist(() -> userRepository.saveAndFlush(user));
        userSyncSupport.syncCreate(saved);
        posCoreClient.sendUserCredentials(new UserCredentialsEmailRequest(
            saved.getId(),
            saved.getUsername(),
            saved.getEmail(),
            saved.getFullName(),
            saved.getRole().getName(),
            saved.getCompanyId(),
            List.copyOf(saved.getStoreIds()),
            rawPassword
        ));
        LogUtil.info(UserCreateHandler.class, "User created: id={}, username={}", saved.getId(), saved.getUsername());
        return userMapper.toResponse(accessPolicy.loadForResponse(saved.getId(), saved));
    }

    private static String resolveFullName(CreateUserRequest req) {
        String built = PersonNameUtil.buildFullName(req.lastName(), req.firstName(), req.patronymic());
        if (StringUtils.hasText(built)) {
            return built;
        }
        if (StringUtils.hasText(req.fullName())) {
            return req.fullName().trim();
        }
        throw IdentityExceptions.badRequest("Full name or FIO is required");
    }

    private static String resolvePasswordForCreate(String roleName, String password, String pin) {
        if ("CASHIER".equalsIgnoreCase(roleName) || "WAITER".equalsIgnoreCase(roleName)) {
            if (StringUtils.hasText(password) && password.trim().length() >= 6) {
                return password.trim();
            }
            return UUID.randomUUID() + "Aa1!";
        }
        if (StringUtils.hasText(password) && password.trim().length() >= 6) {
            return password.trim();
        }
        if (!StringUtils.hasText(password)) {
            return UUID.randomUUID() + "Aa1!";
        }
        throw IdentityExceptions.badRequest("Password must be at least 6 characters");
    }
}

package com.pos.identity.service.user.impl;

import com.pos.identity.dto.user.UpdateUserRequest;
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
import com.pos.identity.util.TextUtil;
import com.pos.identity.util.EmailAddressRules;
import com.pos.identity.util.UserLoginUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashSet;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserUpdateHandler {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final TenantAccessSupport tenantAccess;
    private final UserAccessPolicy accessPolicy;
    private final UserPinService userPinService;
    private final UserMapper userMapper;
    private final UserSyncSupport userSyncSupport;

    @Transactional(rollbackFor = Exception.class)
    public UserResponse update(UUID id, UpdateUserRequest req) {
        User user = accessPolicy.requireAccessible(id);
        applyChanges(user, req);
        LogUtil.info(UserUpdateHandler.class, "User updated: id={}", id);
        User saved = DbExceptionTranslator.persist(() -> userRepository.saveAndFlush(user));
        userSyncSupport.syncUpdate(saved);
        return userMapper.toResponse(accessPolicy.loadForResponse(saved.getId(), saved));
    }

    private void applyChanges(User user, UpdateUserRequest req) {
        if (req.username() != null) {
            String username = UserLoginUtil.normalizeUsername(req.username());
            if (!StringUtils.hasText(username)) {
                throw IdentityExceptions.badRequest("Username is required");
            }
            Integer companyId = accessPolicy.companyId(user);
            if (!username.equalsIgnoreCase(user.getUsername())) {
                accessPolicy.assertUsernameAvailable(companyId, username, user.getId());
                user.setUsername(username);
            }
        }

        if (req.firstName() != null) {
            user.setFirstName(TextUtil.trimOrNull(req.firstName()));
        }
        if (req.lastName() != null) {
            user.setLastName(TextUtil.trimOrNull(req.lastName()));
        }
        if (req.patronymic() != null) {
            user.setPatronymic(TextUtil.trimOrNull(req.patronymic()));
        }
        if (req.fullName() != null && StringUtils.hasText(req.fullName())) {
            user.setFullName(req.fullName().trim());
        } else {
            user.syncFullName();
        }

        if (req.email() != null) {
            String email = EmailAddressRules.require(req.email());
            Integer companyId = accessPolicy.companyId(user);
            if (!email.equalsIgnoreCase(user.getEmail())) {
                accessPolicy.assertEmailAvailable(companyId, email, user.getId());
            }
            user.setEmail(email);
        }

        if (StringUtils.hasText(req.password())) {
            user.setPassword(passwordEncoder.encode(req.password().trim()));
            LogUtil.info(UserUpdateHandler.class, "User password changed: id={}", user.getId());
        }

        if (req.role() != null) {
            Role role = roleRepository.findByName(req.role())
                .orElseThrow(() -> IdentityExceptions.badRequest("Invalid role"));
            accessPolicy.assertRoleAllowedForCreate(role.getName());
            String oldRoleName = user.getRole().getName();
            userPinService.clearOnRoleChange(user, oldRoleName, role.getName(), req.pin());
            user.setRole(role);
        }

        if (StringUtils.hasText(req.pin())) {
            userPinService.applyForUpdate(user, accessPolicy.companyId(user), req.pin());
        }

        if (req.companyId() != null && tenantAccess.isPlatformOperator()) {
            user.setCompanyId(tenantAccess.requireCompanyId(req.companyId()));
        }

        if (req.storeIds() != null) {
            Integer companyId = accessPolicy.companyId(user);
            if (companyId == null) {
                throw IdentityExceptions.badRequest("Assign a company before selecting stores");
            }
            String roleName = req.role() != null ? req.role() : user.getRole().getName();
            UserAccessPolicy.assertCashierStoreAssignment(roleName, req.storeIds());
            user.setStoreIds(new HashSet<>(tenantAccess.resolveStoresForUser(companyId, req.storeIds())));
        }
    }
}

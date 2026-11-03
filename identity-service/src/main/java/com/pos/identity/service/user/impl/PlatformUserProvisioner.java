package com.pos.identity.service.user.impl;

import com.pos.identity.dto.user.PlatformProvisionUserRequest;
import com.pos.identity.dto.user.UserResponse;
import com.pos.identity.entity.Role;
import com.pos.identity.entity.User;
import com.pos.identity.exception.IdentityExceptions;
import com.pos.identity.mapper.UserMapper;
import com.pos.identity.repository.RoleRepository;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.service.user.support.UserAccessPolicy;
import com.pos.identity.util.DbExceptionTranslator;
import com.pos.identity.util.EmailAddressRules;
import com.pos.identity.util.PersonNameUtil;
import com.pos.identity.util.TextUtil;
import com.pos.identity.util.UserLoginUtil;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PlatformUserProvisioner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserAccessPolicy accessPolicy;
    private final UserMapper userMapper;
    private final com.pos.identity.service.support.UserSyncSupport userSyncSupport;

    @Transactional(rollbackFor = Exception.class)
    public UserResponse provisionAdmin(PlatformProvisionUserRequest req) {
        Role role = roleRepository.findByName("ADMIN")
            .orElseThrow(() -> IdentityExceptions.badRequest("Invalid role: ADMIN"));
        Integer companyId = req.companyId();
        String username = UserLoginUtil.normalizeUsername(req.username());
        String email = EmailAddressRules.require(req.email());
        accessPolicy.assertUsernameAvailable(companyId, username, null);
        accessPolicy.assertEmailAvailable(companyId, email, null);

        String rawPassword = StringUtils.hasText(req.password()) && req.password().trim().length() >= 6
            ? req.password().trim()
            : UUID.randomUUID() + "Aa1!";
        String firstName = TextUtil.trimOrNull(req.firstName());
        String lastName = TextUtil.trimOrNull(req.lastName());
        String fullName = PersonNameUtil.buildFullName(lastName, firstName, null);
        if (!StringUtils.hasText(fullName)) {
            fullName = username;
        }
        User user = User.builder()
            .username(username)
            .email(email)
            .password(passwordEncoder.encode(rawPassword))
            .firstName(firstName)
            .lastName(lastName)
            .fullName(fullName)
            .role(role)
            .companyId(companyId)
            .storeIds(req.storeIds() == null ? new HashSet<>() : new HashSet<>(req.storeIds()))
            .isActive(true)
            .mustChangePassword(true)
            .build();
        user.syncFullName();
        User saved = DbExceptionTranslator.persist(() -> userRepository.saveAndFlush(user));
        userSyncSupport.syncCreate(saved);
        LogUtil.info(PlatformUserProvisioner.class, "Platform admin provisioned: id={}, companyId={}", saved.getId(), companyId);
        return userMapper.toResponse(saved);
    }

    @Transactional
    public void delete(UUID userId) {
        userRepository.findById(userId).ifPresent(userRepository::delete);
    }
}

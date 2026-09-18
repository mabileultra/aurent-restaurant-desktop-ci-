package com.pos.identity.service.account.impl;

import com.pos.identity.dto.platform.account.PlatformOperatorAccountResponse;
import com.pos.identity.dto.platform.account.UpdatePlatformOperatorAccountRequest;
import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.exception.ConflictException;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.repository.spec.UserSpecifications;
import com.pos.identity.security.RoleName;
import com.pos.identity.service.account.PlatformOperatorAccountService;
import com.pos.identity.service.support.TenantAccessSupport;
import com.pos.identity.service.support.UserSyncSupport;
import com.pos.identity.util.UserLoginUtil;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlatformOperatorAccountServiceImpl implements PlatformOperatorAccountService {

    private final TenantAccessSupport tenantAccess;
    private final UserRepository userRepository;
    private final UserSyncSupport userSyncSupport;

    @Override
    public PlatformOperatorAccountResponse current() {
        return toResponse(requireSelf());
    }

    @Override
    @Transactional(readOnly = false)
    public PlatformOperatorAccountResponse update(UpdatePlatformOperatorAccountRequest request) {
        User user = requireSelf();
        if (StringUtils.hasText(request.password())) {
            throw new BadRequestException("Смену пароля выполняет только SUPER_ADMIN");
        }
        if (!applyUsername(user, request)) {
            throw new BadRequestException("Укажите новый логин");
        }
        User saved = userRepository.save(user);
        userSyncSupport.syncUpdate(saved);
        LogUtil.info(PlatformOperatorAccountServiceImpl.class, "PLATFORM_ADMIN updated own login: id={}", saved.getId());
        return toResponse(saved);
    }

    private boolean applyUsername(User user, UpdatePlatformOperatorAccountRequest request) {
        String username = UserLoginUtil.normalizeUsername(request.username());
        if (!StringUtils.hasText(username) || username.equals(user.getUsername())) {
            return false;
        }
        long taken = userRepository.count(
            UserSpecifications.lookup().platformOnly().usernameIgnoreCase(username).excludeId(user.getId()).build()
        );
        if (taken > 0) {
            throw new ConflictException("Username already taken");
        }
        user.setUsername(username);
        return true;
    }

    private User requireSelf() {
        User user = tenantAccess.currentUser();
        if (!RoleName.PLATFORM_ADMIN.matches(user) || user.getCompanyId() != null) {
            throw new BadRequestException("Access denied");
        }
        return user;
    }

    private static PlatformOperatorAccountResponse toResponse(User user) {
        return new PlatformOperatorAccountResponse(user.getUsername());
    }
}

package com.pos.identity.service.impl;

import com.pos.identity.dto.user.CreateUserRequest;
import com.pos.identity.dto.user.UpdateUserRequest;
import com.pos.identity.dto.user.UserResponse;
import com.pos.identity.entity.User;
import com.pos.identity.exception.IdentityExceptions;
import com.pos.identity.mapper.UserMapper;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.security.RoleName;
import com.pos.identity.service.UserService;
import com.pos.identity.service.support.TenantAccessSupport;
import com.pos.identity.service.support.UserSyncSupport;
import com.pos.identity.service.user.impl.UserCreateHandler;
import com.pos.identity.service.user.impl.UserDeleteHandler;
import com.pos.identity.service.user.impl.UserUpdateHandler;
import com.pos.identity.service.user.support.UserAccessPolicy;
import com.pos.identity.util.DbExceptionTranslator;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final TenantAccessSupport tenantAccess;
    private final UserAccessPolicy accessPolicy;
    private final UserMapper userMapper;
    private final UserCreateHandler createHandler;
    private final UserUpdateHandler updateHandler;
    private final UserDeleteHandler deleteHandler;
    private final UserSyncSupport userSyncSupport;

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        if (tenantAccess.isPlatformOperator()) {
            return userRepository.findAllWithDetails().stream()
                .filter(accessPolicy::canView)
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
        }
        Integer companyId = tenantAccess.currentUser().getCompanyId();
        if (companyId == null) {
            throw IdentityExceptions.badRequest("Your account is not linked to a company");
        }
        return userRepository.findByCompanyIdWithDetails(companyId).stream()
            .filter(accessPolicy::canView)
            .map(userMapper::toResponse)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse findById(UUID id) {
        return userMapper.toResponse(accessPolicy.requireAccessible(id));
    }

    @Override
    public UserResponse create(CreateUserRequest req) {
        return createHandler.create(req);
    }

    @Override
    public UserResponse update(UUID id, UpdateUserRequest req) {
        return updateHandler.update(id, req);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserResponse toggleActive(UUID id) {
        User user = accessPolicy.requireAccessible(id);
        if (RoleName.isPlatformScope(user.getRole().getName())) {
            throw IdentityExceptions.badRequest("Cannot deactivate platform administrator");
        }
        user.setActive(!user.isActive());
        User saved = DbExceptionTranslator.persist(() -> userRepository.saveAndFlush(user));
        userSyncSupport.syncToggle(saved);
        LogUtil.info(UserServiceImpl.class, "User active toggled: id={}, active={}", id, saved.isActive());
        return userMapper.toResponse(accessPolicy.loadForResponse(saved.getId(), saved));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(UUID id) {
        deleteHandler.delete(id);
    }
}

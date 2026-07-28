package com.pos.identity.service.user.impl;

import com.pos.identity.entity.User;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.service.support.UserSyncSupport;
import com.pos.identity.service.user.support.UserAccessPolicy;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserDeleteHandler {

    private final UserRepository userRepository;
    private final UserAccessPolicy accessPolicy;
    private final UserSyncSupport userSyncSupport;

    @Transactional(rollbackFor = Exception.class)
    public void delete(UUID id) {
        User user = accessPolicy.requireAccessible(id);
        accessPolicy.assertDeletable(user);
        userSyncSupport.syncDelete(user);
        userRepository.delete(user);
        LogUtil.info(UserDeleteHandler.class, "User deleted: id={}, username={}", id, user.getUsername());
    }
}

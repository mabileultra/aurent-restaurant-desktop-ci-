package com.pos.identity.bootstrap;

import com.pos.identity.entity.User;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.security.RoleName;
import com.pos.identity.service.support.UserSyncSupport;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(2)
@RequiredArgsConstructor
public class IdentityUserPosSyncBootstrap implements ApplicationRunner {

    private final UserRepository userRepository;
    private final UserSyncSupport userSyncSupport;

    @Override
    public void run(ApplicationArguments args) {
        int synced = 0;
        for (User user : userRepository.findAllWithDetails()) {
            if (user.getRole() != null && RoleName.SUPER_ADMIN.matches(user)) {
                continue;
            }
            userSyncSupport.syncUpdate(user);
            synced++;
        }
        if (synced > 0) {
            LogUtil.info(IdentityUserPosSyncBootstrap.class, "Bootstrapped {} tenant users to POS core", synced);
        }
    }
}

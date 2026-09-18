package com.pos.identity.bootstrap;

import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(2)
@RequiredArgsConstructor
public class PlatformOperatorSeed implements ApplicationRunner {

    private final PlatformOperatorProvisioner platformOperatorProvisioner;

    @Override
    public void run(ApplicationArguments args) {
        int created = platformOperatorProvisioner.ensureSeeded();
        if (created > 0) {
            LogUtil.info(PlatformOperatorSeed.class, "Ensured {} PLATFORM_ADMIN seed accounts", created);
        }
    }
}

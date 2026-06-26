package com.pos.platform.service.impl;

import com.pos.platform.dto.platform.security.CashierServerPasswordStatusResponse;
import com.pos.platform.dto.platform.security.UpdateCashierServerPasswordRequest;
import com.pos.platform.dto.platform.security.VerifyCashierServerPasswordResponse;
import com.pos.platform.entity.PlatformSetting;
import com.pos.platform.exception.BadRequestException;
import com.pos.platform.repository.PlatformSettingRepository;
import com.pos.platform.security.PlatformTenantContext;
import com.pos.platform.service.PlatformSecurityService;
import com.pos.platform.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlatformSecurityServiceImpl implements PlatformSecurityService {

    private static final String DEFAULT_CASHIER_SERVER_PASSWORD = "aurnt";
    private static final String SUPER_ADMIN_ROLE = "SUPER_ADMIN";

    private final PlatformSettingRepository platformSettingRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public CashierServerPasswordStatusResponse getCashierServerPasswordStatus() {
        assertSuperAdminActor();
        return toPasswordStatus(findOrInitPasswordSetting());
    }

    @Override
    @Transactional
    public CashierServerPasswordStatusResponse updateCashierServerPassword(UpdateCashierServerPasswordRequest request) {
        assertSuperAdminActor();
        PlatformSetting setting = findOrInitPasswordSetting();
        setting.setSettingValue(passwordEncoder.encode(request.password().trim()));
        PlatformSetting saved = platformSettingRepository.save(setting);
        LogUtil.info(PlatformSecurityServiceImpl.class, "Cashier server setup password updated");
        return toPasswordStatus(saved);
    }

    @Override
    public VerifyCashierServerPasswordResponse verifyCashierServerPassword(String password) {
        if (!StringUtils.hasText(password)) {
            return new VerifyCashierServerPasswordResponse(false);
        }
        PlatformSetting setting = findOrInitPasswordSetting();
        boolean valid = passwordEncoder.matches(password.trim(), setting.getSettingValue());
        return new VerifyCashierServerPasswordResponse(valid);
    }

    private PlatformSetting findOrInitPasswordSetting() {
        return platformSettingRepository.findById(PlatformSetting.KEY_CASHIER_SERVER_SETUP_PASSWORD)
            .orElseGet(() -> {
                PlatformSetting created = PlatformSetting.builder()
                    .settingKey(PlatformSetting.KEY_CASHIER_SERVER_SETUP_PASSWORD)
                    .settingValue(passwordEncoder.encode(DEFAULT_CASHIER_SERVER_PASSWORD))
                    .updatedAt(Instant.now())
                    .build();
                return platformSettingRepository.save(created);
            });
    }

    private CashierServerPasswordStatusResponse toPasswordStatus(PlatformSetting setting) {
        String updatedAt = setting.getUpdatedAt() != null ? setting.getUpdatedAt().toString() : null;
        return new CashierServerPasswordStatusResponse(true, updatedAt);
    }

    private void assertSuperAdminActor() {
        if (!SUPER_ADMIN_ROLE.equals(PlatformTenantContext.getRole())) {
            throw new BadRequestException("Access denied");
        }
    }
}

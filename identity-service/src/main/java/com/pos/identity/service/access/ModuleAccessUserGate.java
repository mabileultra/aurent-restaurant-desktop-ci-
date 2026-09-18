package com.pos.identity.service.access;

import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.exception.ResourceNotFoundException;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.security.RoleName;
import com.pos.identity.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ModuleAccessUserGate {

    private final UserRepository userRepository;
    private final TenantAccessSupport tenantAccess;

    public User requireConfigurable(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRole() == null || RoleName.SUPER_ADMIN.matches(user)) {
            throw new BadRequestException("Module access is not configurable for this user");
        }
        if (RoleName.PLATFORM_ADMIN.matches(user)) {
            if (user.getCompanyId() != null) {
                throw new BadRequestException("Platform operator must not belong to a company");
            }
            assertSuperAdminCanManagePlatformStaff();
            return user;
        }
        if (user.getCompanyId() == null) {
            throw new BadRequestException("User has no company");
        }
        return user;
    }

    private void assertSuperAdminCanManagePlatformStaff() {
        if (tenantAccess.isSuperAdmin()) {
            return;
        }
        throw new BadRequestException("Доступы platform staff меняет только SUPER_ADMIN");
    }
}

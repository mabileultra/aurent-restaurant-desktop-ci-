package com.pos.identity.service.auth.support;

import com.pos.identity.client.dto.CompanyDto;
import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.security.RoleName;
import org.springframework.stereotype.Component;

@Component
public class LoginGuard {

    public void assertAllowed(User user, CompanyDto company) {
        if (!user.isActive()) {
            throw new BadRequestException("User account is disabled");
        }
        boolean platformScope = RoleName.isPlatformScope(user);
        if (platformScope && user.getCompanyId() != null) {
            throw new BadRequestException("Invalid username or password");
        }
        if (!platformScope && user.getCompanyId() == null) {
            throw new BadRequestException("Invalid username or password");
        }
        if (!platformScope && company != null && !company.active()) {
            throw new BadRequestException("Company is inactive");
        }
    }
}

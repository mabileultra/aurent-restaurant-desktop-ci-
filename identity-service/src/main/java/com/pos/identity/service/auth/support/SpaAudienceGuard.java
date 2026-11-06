package com.pos.identity.service.auth.support;

import com.pos.identity.client.dto.CompanyDto;
import com.pos.identity.dto.auth.SpaAudience;
import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.security.RoleName;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Ensures handoff audience matches company vertical (platform roles may open MAIN only).
 */
@Component
public class SpaAudienceGuard {

    public void assertCreateAllowed(User user, SpaAudience audience, CompanyDto company) {
        if (audience == SpaAudience.MAIN) {
            return;
        }
        if (RoleName.isPlatformOperator(user) || RoleName.SUPER_ADMIN.matches(user)) {
            throw new BadRequestException("Platform accounts stay on the main SPA");
        }
        assertCompanyMatchesAudience(company, audience);
    }

    public void assertExchangeAllowed(User user, SpaAudience audience, CompanyDto company) {
        assertCreateAllowed(user, audience, company);
    }

    private void assertCompanyMatchesAudience(CompanyDto company, SpaAudience audience) {
        if (company == null || !StringUtils.hasText(company.businessType())) {
            throw new BadRequestException("Company business type required for SPA handoff");
        }
        String type = company.businessType().trim().toUpperCase();
        switch (audience) {
            case PHARMACY -> {
                if (!"PHARMACY".equals(type)) {
                    throw new BadRequestException("Handoff audience PHARMACY requires a pharmacy company");
                }
            }
            case RESTAURANT -> {
                if (!"RESTAURANT".equals(type) && !"CANTEEN".equals(type)) {
                    throw new BadRequestException("Handoff audience RESTAURANT requires a restaurant company");
                }
            }
            default -> {
            }
        }
    }
}

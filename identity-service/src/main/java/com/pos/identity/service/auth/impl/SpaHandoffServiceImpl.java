package com.pos.identity.service.auth.impl;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.client.dto.CompanyDto;
import com.pos.identity.dto.auth.AuthResponse;
import com.pos.identity.dto.auth.HandoffCodeResponse;
import com.pos.identity.dto.auth.SpaAudience;
import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.exception.UnauthorizedException;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.security.CurrentUserProvider;
import com.pos.identity.security.JwtService;
import com.pos.identity.service.auth.SpaHandoffService;
import com.pos.identity.service.auth.support.AuthResponseFactory;
import com.pos.identity.service.auth.support.HandoffCodeStore;
import com.pos.identity.service.auth.support.LoginAuditPublisher;
import com.pos.identity.service.auth.support.SpaAudienceGuard;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class SpaHandoffServiceImpl implements SpaHandoffService {

    private final CurrentUserProvider currentUserProvider;
    private final UserRepository userRepository;
    private final PosCoreClient posCoreClient;
    private final HandoffCodeStore handoffCodeStore;
    private final SpaAudienceGuard spaAudienceGuard;
    private final JwtService jwtService;
    private final AuthResponseFactory authResponseFactory;
    private final LoginAuditPublisher loginAuditPublisher;

    @Override
    @Transactional(readOnly = true)
    public HandoffCodeResponse create(SpaAudience audience) {
        requireAuthenticated();
        User user = currentUserProvider.requireCurrentUser();
        CompanyDto company = loadCompany(user);
        spaAudienceGuard.assertCreateAllowed(user, audience, company);

        String code = handoffCodeStore.put(user.getId(), audience, HandoffCodeStore.DEFAULT_TTL_SECONDS);
        LogUtil.info(
            SpaHandoffServiceImpl.class,
            "SPA handoff created: audience={}, userId={}",
            audience,
            user.getId()
        );
        return new HandoffCodeResponse(code, audience.name(), HandoffCodeStore.DEFAULT_TTL_SECONDS);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse exchange(String code) {
        var entry = handoffCodeStore.consume(code)
            .orElseThrow(() -> new BadRequestException("Invalid or expired handoff code"));

        User user = userRepository.findByIdWithDetails(entry.userId())
            .orElseThrow(() -> new BadRequestException("Invalid or expired handoff code"));
        if (!user.isActive()) {
            throw new BadRequestException("User is inactive");
        }

        CompanyDto company = loadCompany(user);
        spaAudienceGuard.assertExchangeAllowed(user, entry.audience(), company);

        String token = jwtService.generateToken(user);
        loginAuditPublisher.publish(user, "SPA_HANDOFF", entry.audience().name(), null);
        LogUtil.info(
            SpaHandoffServiceImpl.class,
            "SPA handoff exchanged: audience={}, userId={}",
            entry.audience(),
            user.getId()
        );
        return authResponseFactory.build(user, token, company != null ? company.loginCode() : null);
    }

    private void requireAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !StringUtils.hasText(auth.getName())
            || "anonymousUser".equals(auth.getName())) {
            throw new UnauthorizedException("Authentication required");
        }
    }

    private CompanyDto loadCompany(User user) {
        if (user.getCompanyId() == null) {
            return null;
        }
        return posCoreClient.getCompanyById(user.getCompanyId());
    }
}

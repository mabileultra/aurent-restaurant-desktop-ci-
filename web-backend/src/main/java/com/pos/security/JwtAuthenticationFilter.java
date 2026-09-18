package com.pos.security;

import com.pos.entity.User;
import com.pos.security.cache.AuthenticatedUserCache;
import com.pos.service.identity.AuthenticatedUserBootstrapService;
import com.pos.shared.gateway.RequestActorResolver;
import com.pos.shared.http.TenantHeaders;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final String jwtSecret;
    private final String contextSecret;
    private final AuthenticatedUserCache authenticatedUserCache;
    private final AuthenticatedUserBootstrapService authenticatedUserBootstrapService;
    private final CurrentUserProvider currentUserProvider;

    public JwtAuthenticationFilter(
        @Value("${app.jwt.secret}") String jwtSecret,
        @Value("${app.gateway.context-secret:}") String contextSecret,
        AuthenticatedUserCache authenticatedUserCache,
        AuthenticatedUserBootstrapService authenticatedUserBootstrapService,
        CurrentUserProvider currentUserProvider
    ) {
        this.jwtSecret = jwtSecret;
        this.contextSecret = contextSecret;
        this.authenticatedUserCache = authenticatedUserCache;
        this.authenticatedUserBootstrapService = authenticatedUserBootstrapService;
        this.currentUserProvider = currentUserProvider;
    }

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            authenticateIfPresent(request);
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private void authenticateIfPresent(HttpServletRequest request) {
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            return;
        }
        RequestActorResolver.resolve(
            request.getHeader(TenantHeaders.USER_ID),
            request.getHeader(TenantHeaders.COMPANY_ID),
            request.getHeader(TenantHeaders.USER_ROLES),
            request.getHeader(TenantHeaders.GATEWAY_STAMP),
            contextSecret,
            request.getHeader("Authorization"),
            jwtSecret
        ).ifPresent(actor -> authenticateUser(request, actor.userId(), actor.companyId()));
    }

    private void authenticateUser(HttpServletRequest request, UUID userId, Integer companyId) {
        User user = authenticatedUserCache.findById(userId).orElse(null);
        if (user == null || !user.isActive()) {
            if (user == null) {
                user = authenticatedUserBootstrapService.ensureUser(userId).orElse(null);
            }
            if (user == null || !user.isActive()) {
                return;
            }
        }
        if (!userId.equals(user.getId())) {
            return;
        }

        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
            user, null, user.getAuthorities()
        );
        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authToken);

        if (companyId == null && user.getCompany() != null) {
            companyId = user.getCompany().getId();
        }
        TenantContext.set(companyId, currentUserProvider.isPlatformOperator(user));
    }
}

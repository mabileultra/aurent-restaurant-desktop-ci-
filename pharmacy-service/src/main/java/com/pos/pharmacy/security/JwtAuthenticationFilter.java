package com.pos.pharmacy.security;

import com.pos.shared.gateway.GatewayActor;
import com.pos.shared.gateway.RequestActorResolver;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

import static com.pos.shared.http.TenantHeaders.COMPANY_ID;
import static com.pos.shared.http.TenantHeaders.GATEWAY_STAMP;
import static com.pos.shared.http.TenantHeaders.USER_ID;
import static com.pos.shared.http.TenantHeaders.USER_ROLES;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final String jwtSecret;
    private final String contextSecret;

    public JwtAuthenticationFilter(
        @Value("${app.jwt.secret}") String jwtSecret,
        @Value("${app.gateway.context-secret:}") String contextSecret
    ) {
        this.jwtSecret = jwtSecret;
        this.contextSecret = contextSecret;
    }

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            authenticate(request);
            filterChain.doFilter(request, response);
        } finally {
            PharmacyTenantContext.clear();
            SecurityContextHolder.clearContext();
        }
    }

    private void authenticate(HttpServletRequest request) {
        RequestActorResolver.resolve(
            request.getHeader(USER_ID),
            request.getHeader(COMPANY_ID),
            request.getHeader(USER_ROLES),
            request.getHeader(GATEWAY_STAMP),
            contextSecret,
            request.getHeader("Authorization"),
            jwtSecret
        ).ifPresent(this::accept);
    }

    private void accept(GatewayActor actor) {
        PharmacyTenantContext.set(actor.companyId(), actor.userId(), actor.role());
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
            actor.userId().toString(),
            null,
            List.of(new SimpleGrantedAuthority("ROLE_" + actor.role()))
        ));
    }
}

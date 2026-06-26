package com.pos.identity.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.pos.shared.http.TenantHeaders;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                if (jwtService.isTokenValid(token)) {
                    Integer companyId = resolveCompanyId(request, token);
                    UUID userId = jwtService.extractSubjectUserId(token);
                    String role = request.getHeader(TenantHeaders.USER_ROLES);
                    if (role == null || role.isBlank()) {
                        role = jwtService.extractRole(token);
                    }
                    IdentityTenantContext.set(companyId, userId, role);
                    var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
                    var authentication = new UsernamePasswordAuthenticationToken(
                        userId.toString(),
                        null,
                        authorities
                    );
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
            filterChain.doFilter(request, response);
        } finally {
            IdentityTenantContext.clear();
            SecurityContextHolder.clearContext();
        }
    }

    private Integer resolveCompanyId(HttpServletRequest request, String token) {
        Integer companyId = jwtService.extractCompanyId(token);
        if (companyId != null) {
            return companyId;
        }
        String headerValue = request.getHeader(TenantHeaders.COMPANY_ID);
        if (headerValue == null || headerValue.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(headerValue.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}

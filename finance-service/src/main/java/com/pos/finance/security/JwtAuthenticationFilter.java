package com.pos.finance.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.util.List;

import com.pos.shared.http.TenantHeaders;
import com.pos.shared.jwt.JwtClaims;
import com.pos.shared.jwt.JwtClaimsExtractor;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Value("${app.jwt.secret}")
    private String secretKey;

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            if (!request.getRequestURI().contains("/internal/")) {
                String authHeader = request.getHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);
                    try {
                        JwtClaims claims = JwtClaimsExtractor.extract(token, secretKey);
                        Integer companyId = JwtClaimsExtractor.resolveCompanyId(
                            claims.companyId(), request.getHeader(TenantHeaders.COMPANY_ID)
                        );
                        String role = request.getHeader(TenantHeaders.USER_ROLES);
                        if (role == null || role.isBlank()) {
                            role = claims.role();
                        }
                        FinanceTenantContext.set(companyId, claims.userId(), role);
                        var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
                        var authentication = new UsernamePasswordAuthenticationToken(
                            claims.userId().toString(),
                            null,
                            authorities
                        );
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    } catch (Exception ignored) {
                        // невалидный/просроченный токен — не аутентифицируем
                    }
                }
            }
            filterChain.doFilter(request, response);
        } finally {
            FinanceTenantContext.clear();
            SecurityContextHolder.clearContext();
        }
    }
}

package com.pos.identity.security;

import com.pos.identity.repository.UserRepository;
import com.pos.shared.http.TenantHeaders;
import com.pos.shared.jwt.JwtClaimsExtractor;
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

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

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
                if (jwtService.isTokenValid(token) && isAccessVersionCurrent(token)) {
                    String role = jwtService.extractRole(token);
                    Integer companyId = JwtClaimsExtractor.resolveCompanyIdSecure(
                        jwtService.extractCompanyId(token),
                        role,
                        request.getHeader(TenantHeaders.COMPANY_ID)
                    );
                    UUID userId = jwtService.extractSubjectUserId(token);
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

    /** Reject tokens whose access_version claim no longer matches DB (module access changed). */
    private boolean isAccessVersionCurrent(String token) {
        Integer claimVersion = jwtService.extractAccessVersion(token);
        if (claimVersion == null) {
            return true;
        }
        UUID userId = jwtService.extractSubjectUserId(token);
        Integer dbVersion = userRepository.findAccessVersionById(userId).orElse(null);
        return dbVersion != null && dbVersion.equals(claimVersion);
    }
}

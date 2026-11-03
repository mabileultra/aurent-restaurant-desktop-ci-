package com.pos.pharmacy.security;

import com.pos.shared.http.InternalApiHeaders;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/** Protects backend→pharmacy internal tax-analytics endpoints. */
@Component
public class PharmacyInboundApiKeyFilter extends OncePerRequestFilter {

    @Value("${app.pos-core.internal-api-key}")
    private String internalApiKey;

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri == null || !uri.contains("/internal/pharmacy/");
    }

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String key = request.getHeader(InternalApiHeaders.API_KEY);
        if (key == null || !key.equals(internalApiKey)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"message\":\"Invalid internal API key\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }
}

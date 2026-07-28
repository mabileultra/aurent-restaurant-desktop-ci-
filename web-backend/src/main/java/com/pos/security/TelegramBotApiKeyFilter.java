package com.pos.security;

import com.pos.config.telegram.TelegramBotProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class TelegramBotApiKeyFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Bot-Token";

    private final TelegramBotProperties properties;

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri == null || !uri.contains("/public/bot/");
    }

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String expected = properties.getApiToken();
        if (!StringUtils.hasText(expected)) {
            response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Telegram bot API is not configured\"}");
            return;
        }
        String key = request.getHeader(HEADER);
        if (key == null || !key.equals(expected)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Invalid bot API token\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }
}

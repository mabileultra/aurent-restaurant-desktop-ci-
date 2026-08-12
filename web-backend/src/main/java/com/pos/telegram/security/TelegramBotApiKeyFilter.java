package com.pos.telegram.security;

import com.pos.telegram.config.TelegramBotProperties;
import com.pos.telegram.repository.CompanyTelegramBotRepository;
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
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class TelegramBotApiKeyFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Bot-Token";
    public static final String RUNTIME_HEADER = "X-Bot-Runtime-Token";

    private final TelegramBotProperties properties;
    private final CompanyTelegramBotRepository companyTelegramBotRepository;

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
        try {
            String uri = request.getRequestURI();
            if (uri != null && uri.contains("/public/bot/runtime/")) {
                if (!authorizeRuntime(request, response)) {
                    return;
                }
            } else if (!authorizeCompanyBot(request, response)) {
                return;
            }
            filterChain.doFilter(request, response);
        } finally {
            TelegramBotCompanyContext.clear();
        }
    }

    private boolean authorizeRuntime(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String expected = properties.getRuntimeToken();
        if (!StringUtils.hasText(expected)) {
            writeJson(response, HttpServletResponse.SC_SERVICE_UNAVAILABLE,
                "Telegram bot runtime API is not configured");
            return false;
        }
        String key = request.getHeader(RUNTIME_HEADER);
        if (key == null || !key.equals(expected)) {
            writeJson(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid bot runtime token");
            return false;
        }
        return true;
    }

    private boolean authorizeCompanyBot(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String key = request.getHeader(HEADER);
        if (!StringUtils.hasText(key)) {
            writeJson(response, HttpServletResponse.SC_UNAUTHORIZED, "Missing X-Bot-Token");
            return false;
        }

        Optional<Integer> companyIdFromDb =
            companyTelegramBotRepository.findCompanyIdByApiTokenAndEnabledTrue(key.trim());
        if (companyIdFromDb.isPresent()) {
            TelegramBotCompanyContext.setCompanyId(companyIdFromDb.get());
            return true;
        }

        String legacy = properties.getApiToken();
        if (StringUtils.hasText(legacy) && key.equals(legacy)) {
            Integer companyId = properties.resolveCompanyId();
            if (companyId == null) {
                writeJson(response, HttpServletResponse.SC_FORBIDDEN,
                    "Bot is not bound to a company. Set TELEGRAM_BOT_COMPANY_ID or register company_telegram_bots");
                return false;
            }
            TelegramBotCompanyContext.setCompanyId(companyId);
            return true;
        }

        writeJson(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid bot API token");
        return false;
    }

    private static void writeJson(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"" + message.replace("\"", "'") + "\"}");
    }
}

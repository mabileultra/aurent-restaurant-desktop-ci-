package com.pos.idempotency;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.exception.ConflictException;
import com.pos.exception.UnprocessableEntityException;
import com.pos.idempotency.entity.ApiIdempotencyRecord;
import com.pos.idempotency.support.IdempotencyPathMatcher;
import com.pos.idempotency.support.IdempotencyRequestHash;
import com.pos.shared.api.ErrorCode;
import com.pos.shared.log.LogUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Component
@Order(Ordered.LOWEST_PRECEDENCE - 20)
@RequiredArgsConstructor
public class IdempotencyFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Idempotency-Key";

    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !IdempotencyPathMatcher.matches(request.getMethod(), request.getServletPath());
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String key = request.getHeader(HEADER);
        if (!StringUtils.hasText(key)) {
            filterChain.doFilter(request, response);
            return;
        }

        ContentCachingRequestWrapper cachingRequest = new ContentCachingRequestWrapper(request);
        byte[] body = cachingRequest.getInputStream().readAllBytes();
        String scope = request.getMethod().toUpperCase() + ":" + request.getServletPath();
        String requestHash = IdempotencyRequestHash.sha256(body);

        Optional<ApiIdempotencyRecord> existing;
        try {
            existing = idempotencyService.begin(key, scope, requestHash);
        } catch (ConflictException | UnprocessableEntityException ex) {
            writeError(response, ex);
            return;
        }

        if (existing.isPresent()) {
            replay(response, existing.get());
            return;
        }

        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);
        boolean completed = false;
        try {
            filterChain.doFilter(cachingRequest, responseWrapper);
            int status = responseWrapper.getStatus();
            if (status >= 200 && status < 300) {
                String responseBody = new String(responseWrapper.getContentAsByteArray(), StandardCharsets.UTF_8);
                idempotencyService.complete(key, status, responseBody);
                completed = true;
            }
        } finally {
            if (!completed) {
                idempotencyService.abandon(key);
            }
            responseWrapper.copyBodyToResponse();
        }
    }

    private static void replay(HttpServletResponse response, ApiIdempotencyRecord row) throws IOException {
        response.setStatus(row.getResponseStatus() != null ? row.getResponseStatus() : 200);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        if (row.getResponseBody() != null) {
            response.getWriter().write(row.getResponseBody());
        }
    }

    private void writeError(HttpServletResponse response, RuntimeException ex) throws IOException {
        int status = ex instanceof ConflictException ? 409 : 422;
        ErrorCode code = ex instanceof ConflictException ? ErrorCode.CONFLICT : ErrorCode.UNPROCESSABLE_ENTITY;
        response.setStatus(status);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status);
        body.put("error", code.name());
        body.put("message", ex.getMessage());
        objectMapper.writeValue(response.getWriter(), body);
        LogUtil.warn(IdempotencyFilter.class, "Idempotency rejected: status={}, message={}", status, ex.getMessage());
    }
}

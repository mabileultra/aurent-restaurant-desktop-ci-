package com.pos.ai.support;

import com.pos.shared.gateway.OutboundCallerHeaders;
import com.pos.shared.http.TenantHeaders;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component
public class HttpRequestAuthSupport {

    private final String contextSecret;

    public HttpRequestAuthSupport(@Value("${app.gateway.context-secret:}") String contextSecret) {
        this.contextSecret = contextSecret;
    }

    public void apply(RestClient.RequestHeadersSpec<?> spec) {
        HttpServletRequest request = currentRequest();
        if (request == null) {
            return;
        }
        OutboundCallerHeaders.select(
            request.getHeader(TenantHeaders.USER_ID),
            request.getHeader(TenantHeaders.COMPANY_ID),
            request.getHeader(TenantHeaders.USER_ROLES),
            request.getHeader(TenantHeaders.GATEWAY_STAMP),
            request.getHeader(HttpHeaders.AUTHORIZATION),
            contextSecret
        ).forEach(spec::header);
    }

    private static HttpServletRequest currentRequest() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (!(attributes instanceof ServletRequestAttributes servletAttributes)) {
            return null;
        }
        return servletAttributes.getRequest();
    }
}

package com.pos.platform.service.impl;

import com.pos.platform.service.PosCoreProxyService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.RestClient;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class PosCoreProxyServiceImpl implements PosCoreProxyService {

    private static final String OPS_BASE = "/internal/platform/ops/";

    private final RestClient posCoreRestClient;

    @Override
    public ResponseEntity<byte[]> forward(HttpServletRequest request, String publicPrefix, String opsBase) {
        String servletPath = request.getServletPath();
        String suffix = servletPath.length() > publicPrefix.length()
            ? servletPath.substring(publicPrefix.length())
            : "";
        String targetPath = OPS_BASE + opsBase + suffix;
        String query = request.getQueryString();
        if (query != null && !query.isBlank()) {
            targetPath = targetPath + "?" + query;
        }

        HttpMethod method = HttpMethod.valueOf(request.getMethod());
        byte[] requestBody = readRequestBody(request);
        MediaType contentType = resolveContentType(request);

        RestClient.RequestBodySpec spec = posCoreRestClient.method(method).uri(targetPath);
        if (requestBody.length > 0) {
            spec.contentType(contentType != null ? contentType : MediaType.APPLICATION_JSON);
            spec.body(requestBody);
        }

        return spec.exchange((req, res) -> {
            HttpHeaders headers = new HttpHeaders();
            res.getHeaders().forEach((name, values) -> {
                if (!HttpHeaders.TRANSFER_ENCODING.equalsIgnoreCase(name)) {
                    headers.put(name, values);
                }
            });
            byte[] body = res.getBody() != null ? StreamUtils.copyToByteArray(res.getBody()) : new byte[0];
            HttpStatus status = HttpStatus.valueOf(res.getStatusCode().value());
            return new ResponseEntity<>(body, headers, status);
        });
    }

    private static byte[] readRequestBody(HttpServletRequest request) {
        try {
            return StreamUtils.copyToByteArray(request.getInputStream());
        } catch (IOException ex) {
            return new byte[0];
        }
    }

    private static MediaType resolveContentType(HttpServletRequest request) {
        String contentType = request.getContentType();
        if (contentType == null || contentType.isBlank()) {
            return null;
        }
        return MediaType.parseMediaType(contentType);
    }
}

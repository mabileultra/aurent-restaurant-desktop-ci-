package com.pos.integrations.markingvalidation.client;

import com.pos.integrations.markingvalidation.config.MarkingValidationProperties;
import com.pos.integrations.markingvalidation.dto.MarkingValidationResponse;
import com.pos.shared.log.LogUtil;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class TasnifOnkmValidationClient implements MarkingValidationClient {

    private final RestClient restClient;
    private final MarkingValidationProperties properties;

    public TasnifOnkmValidationClient(
        @Qualifier("markingValidationRestClient") RestClient restClient,
        MarkingValidationProperties properties
    ) {
        this.restClient = restClient;
        this.properties = properties;
    }

    @Override
    public MarkingValidationResponse validate(OnkmValidationRequest request) {
        if (!properties.isConfigured()) {
            return MarkingValidationResponse.unavailable("NOT_CONFIGURED", "Проверка маркировки не настроена на сервере");
        }
        HttpOutcome outcome;
        try {
            outcome = restClient.post()
                .uri(properties.getUrl())
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .exchange((req, res) -> new HttpOutcome(res.getStatusCode().value(), readBody(res)));
        } catch (RestClientException ex) {
            LogUtil.warn(TasnifOnkmValidationClient.class, "validation-onkm unreachable: {}", ex.getMessage());
            return MarkingValidationResponse.unavailable("UNREACHABLE", "Сервис проверки маркировки недоступен");
        }

        if (outcome.status() == 401 || outcome.status() == 403) {
            LogUtil.warn(TasnifOnkmValidationClient.class, "validation-onkm auth failed: status={}", outcome.status());
            return MarkingValidationResponse.unavailable(
                "HTTP_" + outcome.status(),
                "Сервис проверки маркировки ответил ошибкой"
            );
        }
        OnkmValidationResponse body = outcome.body();
        if (body == null || body.success() == null) {
            LogUtil.warn(TasnifOnkmValidationClient.class, "validation-onkm unexpected response: status={}", outcome.status());
            return MarkingValidationResponse.unavailable(
                "HTTP_" + outcome.status(),
                "Сервис проверки маркировки ответил ошибкой"
            );
        }
        if (Boolean.TRUE.equals(body.success())) {
            return MarkingValidationResponse.valid();
        }
        String code = normalizeCode(body.code());
        LogUtil.info(TasnifOnkmValidationClient.class, "validation-onkm rejected: code={}", code);
        return MarkingValidationResponse.rejected(code, body.messageRu(), body.messageLat());
    }

    private record HttpOutcome(int status, OnkmValidationResponse body) {
    }

    private static OnkmValidationResponse readBody(RestClient.RequestHeadersSpec.ConvertibleClientHttpResponse res) {
        try {
            return res.bodyTo(OnkmValidationResponse.class);
        } catch (RuntimeException ex) {
            return null;
        }
    }

    /** Налоговая местами отдаёт код как {@code "**2010**"}. */
    static String normalizeCode(String raw) {
        if (raw == null) return null;
        String cleaned = raw.replaceAll("[^A-Za-z0-9_]", "");
        return cleaned.isEmpty() ? null : cleaned;
    }
}

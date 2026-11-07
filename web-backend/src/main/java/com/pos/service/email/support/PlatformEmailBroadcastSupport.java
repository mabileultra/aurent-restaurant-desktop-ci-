package com.pos.service.email.support;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.dto.email.SendBroadcastEmailRequest;
import com.pos.dto.email.SendBroadcastEmailResponse;
import com.pos.email.EmailTemplateRenderer;
import com.pos.email.EmailTemplateType;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ConflictException;
import com.pos.idempotency.IdempotencyService;
import com.pos.idempotency.entity.ApiIdempotencyRecord;
import com.pos.idempotency.support.IdempotencyRequestHash;
import com.pos.service.email.EmailService;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PlatformEmailBroadcastSupport {

    private static final String SCOPE = "platform-email-broadcast";

    private final PlatformEmailRecipientResolver recipientResolver;
    private final PlatformEmailLocaleSupport localeSupport;
    private final EmailTemplateRenderer templateRenderer;
    private final EmailService emailService;
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;

    public SendBroadcastEmailResponse send(SendBroadcastEmailRequest request) {
        List<User> recipients = recipientResolver.resolve(request);
        String locale = localeSupport.normalize(request.locale());
        String key = resolveKey(request, recipients);
        String requestHash = IdempotencyRequestHash.sha256(buildFingerprint(request, recipients, locale));

        Optional<ApiIdempotencyRecord> existing = idempotencyService.begin(key, SCOPE, requestHash);
        if (existing.isPresent()) {
            return replayOrConflict(existing.get());
        }

        try {
            SendBroadcastEmailResponse response = dispatch(recipients, request.subject(), request.message(), locale);
            idempotencyService.complete(key, 200, writeJson(response));
            return response;
        } catch (RuntimeException ex) {
            idempotencyService.abandon(key);
            throw ex;
        }
    }

    public SendBroadcastEmailResponse sendToUser(User user, String subject, String message, String locale) {
        if (user == null || !StringUtils.hasText(user.getEmail())) {
            throw new BadRequestException("У текущего администратора нет email");
        }
        return dispatch(List.of(user), subject, message, localeSupport.normalize(locale));
    }

    private SendBroadcastEmailResponse dispatch(
        List<User> recipients,
        String subject,
        String message,
        String locale
    ) {
        int sent = 0;
        int failed = 0;
        int skipped = 0;
        String trimmedSubject = subject.trim();

        for (User user : recipients) {
            if (!StringUtils.hasText(user.getEmail())) {
                skipped++;
                continue;
            }
            try {
                Map<String, String> vars = buildBroadcastVars(user, trimmedSubject, message, locale);
                String html = templateRenderer.render(EmailTemplateType.BROADCAST, vars);
                emailService.sendHtml(user.getEmail(), trimmedSubject, html);
                sent++;
            } catch (RuntimeException ex) {
                failed++;
                LogUtil.warn(
                    PlatformEmailBroadcastSupport.class,
                    "Broadcast email failed for {}: {}",
                    user.getEmail(),
                    ex.getMessage()
                );
            }
        }
        return new SendBroadcastEmailResponse(sent, failed, skipped);
    }

    private Map<String, String> buildBroadcastVars(User user, String subject, String message, String locale) {
        Map<String, String> vars = new HashMap<>();
        localeSupport.putChrome(vars, locale);
        String fallbackName = vars.getOrDefault("recipientFallback", "User");
        vars.put(
            "recipientName",
            StringUtils.hasText(user.getFullName()) ? user.getFullName().trim() : fallbackName
        );
        vars.put("subject", StringUtils.hasText(subject) ? subject : "Aurent POS");
        vars.put(
            "message",
            StringUtils.hasText(message) ? message : vars.getOrDefault("emptyMessage", "")
        );
        return vars;
    }

    private SendBroadcastEmailResponse replayOrConflict(ApiIdempotencyRecord row) {
        if (row.getStatus() == ApiIdempotencyRecord.Status.IN_PROGRESS) {
            throw new ConflictException("Рассылка с этим ключом уже выполняется");
        }
        if (!StringUtils.hasText(row.getResponseBody())) {
            return new SendBroadcastEmailResponse(0, 0, 0);
        }
        try {
            return objectMapper.readValue(row.getResponseBody(), SendBroadcastEmailResponse.class);
        } catch (JsonProcessingException ex) {
            throw new ConflictException("Не удалось повторить ответ идемпотентности");
        }
    }

    private String resolveKey(SendBroadcastEmailRequest request, List<User> recipients) {
        if (StringUtils.hasText(request.idempotencyKey())) {
            return request.idempotencyKey().trim();
        }
        return sha256(buildFingerprint(request, recipients, localeSupport.normalize(request.locale())));
    }

    private static String buildFingerprint(
        SendBroadcastEmailRequest request,
        List<User> recipients,
        String locale
    ) {
        String ids = recipients.stream()
            .map(u -> u.getId().toString())
            .sorted()
            .collect(Collectors.joining(","));
        return request.subject().trim() + "\n"
            + request.message().trim() + "\n"
            + locale + "\n"
            + request.selectAll() + "\n"
            + ids;
    }

    private String writeJson(SendBroadcastEmailResponse response) {
        try {
            return objectMapper.writeValueAsString(response);
        } catch (JsonProcessingException ex) {
            return "{\"sent\":" + response.sent()
                + ",\"failed\":" + response.failed()
                + ",\"skipped\":" + response.skipped() + "}";
        }
    }

    private static String sha256(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 unavailable", ex);
        }
    }
}

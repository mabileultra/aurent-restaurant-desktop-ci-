package com.pos.service.email.impl;

import com.pos.config.MailProperties;
import com.pos.dto.email.EmailTemplateInfoResponse;
import com.pos.dto.email.EmailTemplatePreviewRequest;
import com.pos.dto.email.EmailTemplatePreviewResponse;
import com.pos.dto.email.SendBroadcastEmailRequest;
import com.pos.dto.email.SendBroadcastEmailResponse;
import com.pos.dto.email.SendTestEmailRequest;
import com.pos.email.EmailTemplateRenderer;
import com.pos.email.EmailTemplateType;
import com.pos.entity.Company;
import com.pos.entity.User;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.UserRepository;
import com.pos.service.email.PlatformEmailService;
import com.pos.service.email.support.PlatformEmailBroadcastSupport;
import com.pos.service.email.support.PlatformEmailLocaleSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlatformEmailServiceImpl implements PlatformEmailService {

    private final EmailTemplateRenderer templateRenderer;
    private final UserRepository userRepository;
    private final MailProperties mailProperties;
    private final PlatformEmailBroadcastSupport broadcastSupport;
    private final PlatformEmailLocaleSupport localeSupport;

    @Override
    public List<EmailTemplateInfoResponse> listTemplates() {
        List<EmailTemplateInfoResponse> result = new ArrayList<>();
        for (EmailTemplateType type : EmailTemplateType.values()) {
            result.add(new EmailTemplateInfoResponse(
                type.name(),
                type.title(),
                type.description(),
                type.variables()
            ));
        }
        return result;
    }

    @Override
    public EmailTemplatePreviewResponse preview(EmailTemplatePreviewRequest request) {
        EmailTemplateType type = request.templateType();
        User sampleUser = resolveSampleUser(request.sampleUserId());
        Map<String, String> vars = buildVariables(type, sampleUser, request.subject(), request.message(), "uz");
        if (request.overrides() != null) {
            vars.putAll(request.overrides());
        }
        String html = templateRenderer.render(type, vars);
        String subject = resolveSubject(type, request.subject(), vars);
        return new EmailTemplatePreviewResponse(subject, html);
    }

    @Override
    @Transactional
    public SendBroadcastEmailResponse sendBroadcast(SendBroadcastEmailRequest request) {
        return broadcastSupport.send(request);
    }

    @Override
    @Transactional
    public SendBroadcastEmailResponse sendTest(SendTestEmailRequest request) {
        User actor = userRepository.findByIdWithDetails(request.actorUserId())
            .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
        return broadcastSupport.sendToUser(actor, request.subject(), request.message(), request.locale());
    }

    private User resolveSampleUser(UUID sampleUserId) {
        if (sampleUserId == null) {
            return userRepository.findAllWithDetails().stream()
                .filter(u -> StringUtils.hasText(u.getEmail()))
                .findFirst()
                .orElse(null);
        }
        return userRepository.findByIdWithDetails(sampleUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Map<String, String> buildVariables(
        EmailTemplateType type,
        User user,
        String subject,
        String message,
        String locale
    ) {
        Map<String, String> vars = new HashMap<>();
        localeSupport.putChrome(vars, locale);
        Company company = user != null ? user.getCompany() : null;

        switch (type) {
            case USER_CREDENTIALS -> {
                vars.put("fullName", user != null ? safe(user.getFullName(), "Иван Иванов") : "Иван Иванов");
                vars.put("username", user != null ? safe(user.getUsername(), "admin") : "admin");
                vars.put("password", "********");
                vars.put("role", user != null && user.getRole() != null ? user.getRole().getName() : "ADMIN");
                vars.put("companyName", company != null ? safe(company.getName(), "Demo Company") : "Demo Company");
                vars.put("companyLoginCode", company != null ? safe(company.getLoginCode(), "10000") : "10000");
                vars.put("loginUrl", mailProperties.getLoginUrl());
            }
            case SUPER_ADMIN_LOGIN -> {
                vars.put("fullName", user != null ? safe(user.getFullName(), "Super Admin") : "Super Admin");
                vars.put("username", user != null ? safe(user.getUsername(), "superadmin") : "superadmin");
                vars.put("email", user != null ? safe(user.getEmail(), "admin@example.com") : "admin@example.com");
                vars.put("loginTime", "05.06.2026 14:30:00 +05");
                vars.put("ipAddress", "192.168.1.10");
                vars.put("userAgent", "Mozilla/5.0 (preview)");
            }
            case BROADCAST -> {
                String fallback = vars.getOrDefault("recipientFallback", "User");
                vars.put("recipientName", user != null ? safe(user.getFullName(), fallback) : fallback);
                vars.put("subject", safe(subject, "Aurent POS"));
                vars.put("message", StringUtils.hasText(message) ? message : vars.getOrDefault("emptyMessage", ""));
            }
        }
        return vars;
    }

    private static String resolveSubject(EmailTemplateType type, String subject, Map<String, String> vars) {
        return switch (type) {
            case USER_CREDENTIALS -> "Данные для входа — Aurent POS";
            case SUPER_ADMIN_LOGIN -> "Вход супер-админа: " + vars.getOrDefault("fullName", "");
            case BROADCAST -> safe(subject, "Рассылка");
        };
    }

    private static String safe(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }
}

package com.pos.telegram.service.impl;

import com.pos.entity.Company;
import com.pos.shared.log.LogUtil;
import com.pos.telegram.dto.CompanyTelegramBotResponse;
import com.pos.telegram.dto.TelegramBotRuntimeInstanceDto;
import com.pos.telegram.dto.UpsertCompanyTelegramBotRequest;
import com.pos.telegram.entity.CompanyTelegramBot;
import com.pos.telegram.repository.CompanyTelegramBotRepository;
import com.pos.telegram.service.CompanyTelegramBotService;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CompanyTelegramBotServiceImpl implements CompanyTelegramBotService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final CompanyTelegramBotRepository repository;
    private final TenantAccessSupport tenantAccessSupport;

    @Override
    @Transactional(readOnly = true)
    public CompanyTelegramBotResponse getForCurrentCompany() {
        Integer companyId = tenantAccessSupport.requireEffectiveCompanyId();
        return repository.findByCompanyId(companyId)
            .map(bot -> toResponse(bot, false))
            .orElseGet(() -> emptyResponse(companyId));
    }

    @Override
    public CompanyTelegramBotResponse upsertForCurrentCompany(UpsertCompanyTelegramBotRequest request) {
        Integer companyId = tenantAccessSupport.requireEffectiveCompanyId();
        Company company = tenantAccessSupport.requireCompany(companyId);

        CompanyTelegramBot bot = repository.findByCompanyId(companyId).orElseGet(CompanyTelegramBot::new);
        bot.setCompany(company);
        bot.setBotToken(request.botToken().trim());
        bot.setBotUsername(normalizeUsername(request.botUsername()));
        bot.setSupportGroupId(blankToNull(request.supportGroupId()));
        bot.setEnabled(request.enabled() == null || Boolean.TRUE.equals(request.enabled()));

        if (StringUtils.hasText(request.apiToken())) {
            bot.setApiToken(request.apiToken().trim());
        } else if (!StringUtils.hasText(bot.getApiToken())) {
            bot.setApiToken(generateApiToken());
        }

        CompanyTelegramBot saved = repository.save(bot);
        LogUtil.info(
            CompanyTelegramBotServiceImpl.class,
            "Company telegram bot upserted: companyId={}, username={}, enabled={}",
            companyId,
            saved.getBotUsername(),
            saved.isEnabled()
        );
        return toResponse(saved, true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TelegramBotRuntimeInstanceDto> listRuntimeInstances() {
        return repository.findEnabledWithCompany().stream()
            .map(bot -> new TelegramBotRuntimeInstanceDto(
                bot.getCompany().getId(),
                bot.getCompany().getName(),
                bot.getBotUsername(),
                bot.getBotToken(),
                bot.getApiToken(),
                bot.getSupportGroupId()
            ))
            .toList();
    }

    private static CompanyTelegramBotResponse emptyResponse(Integer companyId) {
        return new CompanyTelegramBotResponse(companyId, null, null, false, false, false, null);
    }

    private static CompanyTelegramBotResponse toResponse(CompanyTelegramBot bot, boolean includeApiToken) {
        return new CompanyTelegramBotResponse(
            bot.getCompany().getId(),
            bot.getBotUsername(),
            bot.getSupportGroupId(),
            bot.isEnabled(),
            StringUtils.hasText(bot.getBotToken()),
            StringUtils.hasText(bot.getApiToken()),
            includeApiToken ? bot.getApiToken() : null
        );
    }

    private static String normalizeUsername(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        String value = raw.trim();
        if (value.startsWith("@")) {
            value = value.substring(1);
        }
        return value.isBlank() ? null : value;
    }

    private static String blankToNull(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        String value = raw.trim();
        return value.isEmpty() ? null : value;
    }

    private static String generateApiToken() {
        byte[] bytes = new byte[24];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}

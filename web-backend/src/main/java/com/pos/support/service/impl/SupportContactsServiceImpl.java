package com.pos.support.service.impl;

import com.pos.support.config.SupportContactsProperties;
import com.pos.support.dto.SupportContactsResponse;
import com.pos.support.service.SupportContactsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class SupportContactsServiceImpl implements SupportContactsService {

    private final SupportContactsProperties properties;

    @Override
    public SupportContactsResponse getContacts() {
        String phone = StringUtils.hasText(properties.getPhone()) ? properties.getPhone().trim() : null;
        String bot = properties.normalizedTelegramBot();
        String url = bot != null ? "https://t.me/" + bot : null;
        return new SupportContactsResponse(phone, bot, url);
    }
}

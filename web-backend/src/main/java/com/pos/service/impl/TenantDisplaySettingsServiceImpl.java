package com.pos.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.dto.tenant.TenantDisplaySettingsPayload;
import com.pos.entity.Company;
import com.pos.entity.CompanyTenantDisplaySettings;
import com.pos.exception.BadRequestException;
import com.pos.repository.CompanyTenantDisplaySettingsRepository;
import com.pos.service.TenantDisplaySettingsService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.log.LogUtil;
import com.pos.util.TextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TenantDisplaySettingsServiceImpl implements TenantDisplaySettingsService {

    private static final int MAX_LOGO_CHARS = 750_000;

    private final CompanyTenantDisplaySettingsRepository repository;
    private final TenantAccessSupport tenantAccess;
    private final ObjectMapper objectMapper;

    @Override
    public TenantDisplaySettingsPayload getForCurrentCompany() {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        try {
            return repository.findSettingsJsonByCompanyId(companyId)
                .map(this::parsePayload)
                .orElseGet(TenantDisplaySettingsServiceImpl::emptyPayload);
        } catch (RuntimeException ex) {
            LogUtil.warn(
                TenantDisplaySettingsServiceImpl.class,
                "Tenant display settings read failed (companyId={}): {}",
                companyId,
                rootMessage(ex)
            );
            return emptyPayload();
        }
    }

    @Override
    @Transactional
    public TenantDisplaySettingsPayload saveForCurrentCompany(TenantDisplaySettingsPayload payload) {
        if (payload == null) {
            throw new BadRequestException("Settings payload is required");
        }
        validateLogo(payload.systemLogoDataUrl());
        validateLogo(payload.receiptLogoDataUrl());

        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Company company = tenantAccess.requireCompany(companyId);
        JsonNode json = objectMapper.valueToTree(sanitize(payload));

        CompanyTenantDisplaySettings row = repository.findByCompanyId(companyId)
            .orElseGet(() -> {
                CompanyTenantDisplaySettings created = new CompanyTenantDisplaySettings();
                created.bindCompany(company);
                return created;
            });
        if (row.getCompanyId() == null) {
            row.bindCompany(company);
        }
        row.setSettings(json);
        repository.save(row);

        LogUtil.info(
            TenantDisplaySettingsServiceImpl.class,
            "Tenant display settings saved: companyId={}",
            companyId
        );
        return parsePayload(json);
    }

    private TenantDisplaySettingsPayload sanitize(TenantDisplaySettingsPayload payload) {
        return new TenantDisplaySettingsPayload(
            TextUtil.trimOrNull(payload.systemLogoDataUrl()),
            payload.systemLogoSizePx(),
            TextUtil.trimOrNull(payload.systemAppName()),
            TextUtil.trimOrNull(payload.receiptLogoDataUrl()),
            payload.receiptLogoMaxHeightMm(),
            TextUtil.trimOrNull(payload.receiptCompanyName()),
            TextUtil.trimOrNull(payload.receiptCompanyAddress()),
            TextUtil.trimOrNull(payload.receiptCompanyPhone()),
            TextUtil.trimOrNull(payload.receiptStir()),
            payload.receiptFields(),
            payload.userFormFields(),
            payload.printSettings()
        );
    }

    private static void validateLogo(String dataUrl) {
        if (!StringUtils.hasText(dataUrl)) {
            return;
        }
        if (dataUrl.length() > MAX_LOGO_CHARS) {
            throw new BadRequestException("Logo image is too large (max ~512 KB)");
        }
        if (!dataUrl.startsWith("data:image/")) {
            throw new BadRequestException("Logo must be a PNG or JPG image");
        }
    }

    private TenantDisplaySettingsPayload parsePayload(String settingsJson) {
        if (!StringUtils.hasText(settingsJson)) {
            return emptyPayload();
        }
        try {
            JsonNode node = objectMapper.readTree(settingsJson);
            return parsePayload(node);
        } catch (Exception ex) {
            LogUtil.warn(
                TenantDisplaySettingsServiceImpl.class,
                "Tenant display settings JSON parse failed: {}",
                rootMessage(ex)
            );
            return emptyPayload();
        }
    }

    private TenantDisplaySettingsPayload parsePayload(JsonNode settings) {
        if (settings == null || settings.isNull() || settings.isMissingNode()) {
            return emptyPayload();
        }
        if (!settings.isObject()) {
            LogUtil.warn(
                TenantDisplaySettingsServiceImpl.class,
                "Tenant display settings JSON is not an object: {}",
                settings.getNodeType()
            );
            return emptyPayload();
        }
        try {
            return objectMapper.convertValue(settings, TenantDisplaySettingsPayload.class);
        } catch (IllegalArgumentException ex) {
            LogUtil.warn(
                TenantDisplaySettingsServiceImpl.class,
                "Tenant display settings mapping failed: {}",
                rootMessage(ex)
            );
            return emptyPayload();
        }
    }

    private static TenantDisplaySettingsPayload emptyPayload() {
        return new TenantDisplaySettingsPayload(
            null, null, null, null, null,
            null, null, null, null,
            null, null, null
        );
    }

    private static String rootMessage(Throwable ex) {
        Throwable cur = ex;
        while (cur.getCause() != null && cur.getCause() != cur) {
            cur = cur.getCause();
        }
        String msg = cur.getMessage();
        return msg != null ? msg : cur.getClass().getSimpleName();
    }
}

package com.pos.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.dto.tenant.TenantDisplaySettingsPayload;
import com.pos.exception.BadRequestException;
import com.pos.service.TenantDisplaySettingsService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.log.LogUtil;
import com.pos.util.TextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TenantDisplaySettingsServiceImpl implements TenantDisplaySettingsService {

    private static final int MAX_LOGO_CHARS = 750_000;

    private final TenantAccessSupport tenantAccess;
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;

    /**
     * Read outside a Hibernate transaction on purpose: a failed SQL inside
     * {@code @Transactional} marks the session rollback-only and then commit
     * throws UnexpectedRollbackException → HTTP 500 even after a catch.
     */
    @Override
    public TenantDisplaySettingsPayload getForCurrentCompany() {
        // Read-only bootstrap: SA/PLATFORM without company context → empty defaults, not 400.
        Integer companyId = tenantAccess.effectiveCompanyIdOrNull();
        if (companyId == null) {
            return emptyPayload();
        }
        try {
            List<String> rows = jdbcTemplate.query(
                """
                    SELECT CAST(settings AS text)
                    FROM company_tenant_display_settings
                    WHERE company_id = ?
                    """,
                (rs, rowNum) -> rs.getString(1),
                companyId
            );
            if (rows.isEmpty() || !StringUtils.hasText(rows.get(0))) {
                return emptyPayload();
            }
            return parsePayload(rows.get(0));
        } catch (Exception ex) {
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
        // Ensure company exists / tenant access (throws if invalid).
        tenantAccess.requireCompany(companyId);

        TenantDisplaySettingsPayload sanitized = sanitize(payload);
        String json;
        try {
            json = objectMapper.writeValueAsString(sanitized);
        } catch (Exception ex) {
            throw new BadRequestException("Invalid settings payload");
        }

        // JDBC upsert avoids Hibernate "null identifier" on first insert of shared-PK entity.
        jdbcTemplate.update(
            """
                INSERT INTO company_tenant_display_settings (company_id, settings, updated_at)
                VALUES (?, CAST(? AS jsonb), NOW())
                ON CONFLICT (company_id) DO UPDATE
                SET settings = EXCLUDED.settings,
                    updated_at = NOW()
                """,
            companyId,
            json
        );

        LogUtil.info(
            TenantDisplaySettingsServiceImpl.class,
            "Tenant display settings saved: companyId={}",
            companyId
        );
        return sanitized;
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
            payload.printSettings(),
            payload.uiTheme(),
            payload.receiptFieldStyles()
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
            null, null, null, null, null
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

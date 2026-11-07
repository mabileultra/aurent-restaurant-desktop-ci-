package com.pos.identity.service.security.support;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.identity.dto.security.LoginRulesDto;
import com.pos.identity.entity.PlatformLoginRules;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.repository.PlatformLoginRulesRepository;
import com.pos.identity.security.IdentityTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class LoginRulesSupport {

    public static final int RULES_ROW_ID = 1;

    private final PlatformLoginRulesRepository rulesRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public LoginRulesDto get() {
        return read(rulesRepository.findById(RULES_ROW_ID).orElse(null));
    }

    @Transactional
    public LoginRulesDto save(LoginRulesDto rules) {
        if (rules == null) {
            throw new BadRequestException("rules required");
        }
        PlatformLoginRules row = rulesRepository.findById(RULES_ROW_ID)
            .orElseGet(() -> PlatformLoginRules.builder().id(RULES_ROW_ID).build());
        try {
            row.setRulesJson(objectMapper.writeValueAsString(normalize(rules)));
        } catch (JsonProcessingException ex) {
            throw new BadRequestException("Invalid rules payload");
        }
        row.setUpdatedAt(Instant.now());
        row.setUpdatedBy(IdentityTenantContext.userId());
        rulesRepository.save(row);
        return get();
    }

    public boolean requiresTotp(LoginRulesDto rules, String roleName) {
        if (rules == null || rules.tfa() == null || roleName == null) {
            return false;
        }
        return switch (roleName) {
            case "SUPER_ADMIN" -> Boolean.TRUE.equals(rules.tfa().get("sa"));
            case "PLATFORM_ADMIN" -> Boolean.TRUE.equals(rules.tfa().get("op"));
            case "PLATFORM_ANALYTICS" -> Boolean.TRUE.equals(rules.tfa().get("an"));
            default -> false;
        };
    }

    private LoginRulesDto read(PlatformLoginRules row) {
        if (row == null || row.getRulesJson() == null) {
            return defaults();
        }
        try {
            return normalize(objectMapper.readValue(row.getRulesJson(), LoginRulesDto.class));
        } catch (JsonProcessingException ex) {
            return defaults();
        }
    }

    private LoginRulesDto normalize(LoginRulesDto rules) {
        LoginRulesDto base = defaults();
        return new LoginRulesDto(
            rules.tfa() != null ? rules.tfa() : base.tfa(),
            rules.method() != null ? rules.method() : base.method(),
            rules.minLen() > 0 ? rules.minLen() : base.minLen(),
            rules.expiry() >= 0 ? rules.expiry() : base.expiry(),
            rules.req() != null ? rules.req() : base.req(),
            Math.max(0, rules.idle()),
            rules.maxH() > 0 ? rules.maxH() : base.maxH(),
            rules.conc() > 0 ? rules.conc() : base.conc(),
            rules.notifyOn(),
            rules.attempts() > 0 ? rules.attempts() : base.attempts(),
            rules.lockMin() > 0 ? rules.lockMin() : base.lockMin(),
            rules.ipOn(),
            rules.ips() != null ? rules.ips() : List.of()
        );
    }

    public static LoginRulesDto defaults() {
        return new LoginRulesDto(
            Map.of("sa", true, "op", false, "an", false),
            "app",
            10,
            90,
            Map.of("case", true, "digit", true, "special", false, "history", true),
            0,
            12,
            3,
            true,
            5,
            15,
            false,
            List.of()
        );
    }
}

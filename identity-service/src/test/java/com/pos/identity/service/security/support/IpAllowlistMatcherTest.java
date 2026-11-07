package com.pos.identity.service.security.support;

import com.pos.identity.dto.security.LoginRulesDto;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class IpAllowlistMatcherTest {

    private final IpAllowlistMatcher matcher = new IpAllowlistMatcher();

    @Test
    void disabledAllowlistAcceptsAnyIp() {
        LoginRulesDto rules = LoginRulesSupport.defaults();
        assertTrue(matcher.isAllowed(rules, "1.2.3.4"));
    }

    @Test
    void exactAndCidrMatch() {
        LoginRulesDto rules = new LoginRulesDto(
            Map.of(),
            "app",
            10,
            90,
            Map.of(),
            0,
            12,
            3,
            true,
            5,
            15,
            true,
            List.of(
                new LoginRulesDto.IpAllowEntry("195.158.8.40", "office", false),
                new LoginRulesDto.IpAllowEntry("213.230.98.0/24", "net", true)
            )
        );
        assertTrue(matcher.isAllowed(rules, "195.158.8.40"));
        assertTrue(matcher.isAllowed(rules, "213.230.98.15"));
        assertFalse(matcher.isAllowed(rules, "8.8.8.8"));
    }
}

package com.pos.identity.service.security.support;

import com.pos.identity.dto.security.LoginRulesDto;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.net.InetAddress;
import java.util.List;

@Component
public class IpAllowlistMatcher {

    public boolean isAllowed(LoginRulesDto rules, String clientIp) {
        if (rules == null || !rules.ipOn()) {
            return true;
        }
        List<LoginRulesDto.IpAllowEntry> ips = rules.ips();
        if (ips == null || ips.isEmpty()) {
            return false;
        }
        if (!StringUtils.hasText(clientIp)) {
            return false;
        }
        String ip = clientIp.trim();
        for (LoginRulesDto.IpAllowEntry entry : ips) {
            if (entry == null || !StringUtils.hasText(entry.addr())) {
                continue;
            }
            if (matches(entry.addr().trim(), ip)) {
                return true;
            }
        }
        return false;
    }

    private boolean matches(String pattern, String ip) {
        if (pattern.contains("/")) {
            return cidrContains(pattern, ip);
        }
        return pattern.equals(ip);
    }

    private boolean cidrContains(String cidr, String ip) {
        try {
            String[] parts = cidr.split("/");
            InetAddress network = InetAddress.getByName(parts[0]);
            InetAddress address = InetAddress.getByName(ip);
            int prefix = Integer.parseInt(parts[1]);
            byte[] net = network.getAddress();
            byte[] addr = address.getAddress();
            if (net.length != addr.length) {
                return false;
            }
            int fullBytes = prefix / 8;
            int remBits = prefix % 8;
            for (int i = 0; i < fullBytes; i++) {
                if (net[i] != addr[i]) {
                    return false;
                }
            }
            if (remBits == 0) {
                return true;
            }
            int mask = (-1) << (8 - remBits);
            return (net[fullBytes] & mask) == (addr[fullBytes] & mask);
        } catch (Exception ex) {
            return false;
        }
    }
}

package com.pos.identity.service.security.support;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class UserAgentDeviceParser {

    public record DeviceInfo(String label, String type) {}

    public DeviceInfo parse(String userAgent) {
        if (!StringUtils.hasText(userAgent)) {
            return new DeviceInfo("Unknown device", "desktop");
        }
        String ua = userAgent.trim();
        boolean phone = ua.toLowerCase().contains("mobile")
            || ua.toLowerCase().contains("android")
            || ua.toLowerCase().contains("iphone");
        String browser = detectBrowser(ua);
        String os = detectOs(ua);
        return new DeviceInfo(browser + " · " + os, phone ? "phone" : "desktop");
    }

    private static String detectBrowser(String ua) {
        String lower = ua.toLowerCase();
        if (lower.contains("edg/")) return "Edge";
        if (lower.contains("chrome/")) return "Chrome";
        if (lower.contains("firefox/")) return "Firefox";
        if (lower.contains("safari/") && !lower.contains("chrome/")) return "Safari";
        return "Browser";
    }

    private static String detectOs(String ua) {
        String lower = ua.toLowerCase();
        if (lower.contains("windows")) return "Windows";
        if (lower.contains("mac os") || lower.contains("macintosh")) return "macOS";
        if (lower.contains("android")) return "Android";
        if (lower.contains("iphone") || lower.contains("ipad") || lower.contains("ios")) return "iOS";
        if (lower.contains("linux")) return "Linux";
        return "OS";
    }
}

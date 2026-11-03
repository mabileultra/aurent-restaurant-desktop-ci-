package com.pos.platform.support;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;

public final class LeadActorName {

    private LeadActorName() {
    }

    public static String current() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && StringUtils.hasText(auth.getName())) {
            return auth.getName();
        }
        return "Administrator";
    }
}

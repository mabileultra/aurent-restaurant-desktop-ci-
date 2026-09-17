package com.pos.integrations.pharmacy.support;

import org.springframework.util.StringUtils;

public final class AslApiKeySupport {

  private AslApiKeySupport() {
  }

  public static boolean hasKey(String apiKey) {
    return StringUtils.hasText(bearerToken(apiKey));
  }

  public static String bearerToken(String apiKey) {
    if (!StringUtils.hasText(apiKey)) {
      return "";
    }
    String trimmed = apiKey.trim();
    if (trimmed.regionMatches(true, 0, "Bearer ", 0, 7)) {
      return trimmed.substring(7).trim();
    }
    return trimmed;
  }
}

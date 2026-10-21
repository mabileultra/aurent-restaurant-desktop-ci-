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
    String trimmed = apiKey.trim()
        .replace('\uFEFF', ' ')
        .replace('\u00A0', ' ')
        .trim();
    trimmed = unwrapQuotes(trimmed);
    if (trimmed.regionMatches(true, 0, "Bearer ", 0, 7)) {
      trimmed = unwrapQuotes(trimmed.substring(7).trim());
    }
    return trimmed.replaceAll("\\s+", "");
  }

  private static String unwrapQuotes(String value) {
    if (value.length() < 2) {
      return value;
    }
    char open = value.charAt(0);
    char close = value.charAt(value.length() - 1);
    if ((open == '"' && close == '"') || (open == '\'' && close == '\'')) {
      return value.substring(1, value.length() - 1).trim();
    }
    return value;
  }
}

package com.pos.integrations.pharmacy.support;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class AslMarkCodeMasker {

  public String shortCode(String raw) {
    if (!StringUtils.hasText(raw)) {
      return null;
    }
    String value = raw.replace("\uFEFF", "").replace("\u0000", "").trim();
    if (value.length() <= 24) {
      return value;
    }
    return value.substring(0, 10) + "…" + value.substring(value.length() - 8);
  }

  public String truncateMessage(String message) {
    if (!StringUtils.hasText(message)) {
      return null;
    }
    String trimmed = message.trim();
    if (trimmed.length() <= 500) {
      return trimmed;
    }
    return trimmed.substring(0, 497) + "...";
  }
}

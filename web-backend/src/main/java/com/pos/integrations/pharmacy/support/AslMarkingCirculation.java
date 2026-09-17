package com.pos.integrations.pharmacy.support;

import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Статусы ASL Belgisi, при которых код уже выведен из оборота продажей. */
public final class AslMarkingCirculation {

  private static final List<String> SOLD_MARKERS = List.of(
    "WITHDRAWN",
    "WRITTEN_OFF",
    "WRITTENOFF",
    "SOLD",
    "RETIRED",
    "DROPPED_OUT",
    "ВЫВЕДЕН",
    "ПРОДАН",
    "РЕАЛИЗОВ"
  );

  private AslMarkingCirculation() {
  }

  public static boolean alreadySold(String status, Map<String, Object> details) {
    if (containsSoldMarker(status)) {
      return true;
    }
    if (details == null || details.isEmpty()) {
      return false;
    }
    for (String key : List.of("status", "codeStatus", "extendedStatus", "state", "withdrawReason", "withdrawalReason")) {
      Object value = details.get(key);
      if (value != null && containsSoldMarker(String.valueOf(value))) {
        return true;
      }
    }
    return false;
  }

  private static boolean containsSoldMarker(String raw) {
    if (!StringUtils.hasText(raw)) {
      return false;
    }
    String upper = raw.toUpperCase(Locale.ROOT);
    if ("INTRODUCED".equals(upper) || "APPLIED".equals(upper) || "EMITTED".equals(upper)) {
      return false;
    }
    return SOLD_MARKERS.stream().anyMatch(upper::contains);
  }
}

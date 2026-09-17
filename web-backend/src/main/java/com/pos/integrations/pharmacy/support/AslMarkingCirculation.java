package com.pos.integrations.pharmacy.support;

import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Статусы ASL Belgisi Open API (13.15), при которых продажа на кассе недоступна. */
public final class AslMarkingCirculation {

  private static final List<String> SOLD_MARKERS = List.of(
    "WITHDRAWN",
    "WRITTEN_OFF",
    "WRITTENOFF",
    "SOLD",
    "RETIRED",
    "DROPPED_OUT",
    "DROPOUT",
    "ВЫВЕДЕН",
    "ПРОДАН",
    "РЕАЛИЗОВ",
    "СПИСАН"
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
    // v1.45: код уже участвовал в розничном чеке без смены состояния
    if (truthy(details.get("firstWithdrawCodeStateUnchanged"))) {
      return true;
    }
    for (String key : List.of("status", "codeStatus", "state", "withdrawReason", "withdrawalReason")) {
      Object value = details.get(key);
      if (value != null && containsSoldMarker(String.valueOf(value))) {
        return true;
      }
    }
    return false;
  }

  private static boolean truthy(Object value) {
    if (value == null) {
      return false;
    }
    if (value instanceof Boolean bool) {
      return bool;
    }
    String text = String.valueOf(value).trim();
    return "true".equalsIgnoreCase(text) || "1".equals(text);
  }

  private static boolean containsSoldMarker(String raw) {
    if (!StringUtils.hasText(raw)) {
      return false;
    }
    String upper = raw.toUpperCase(Locale.ROOT);
    // справочник 13.15: RECEIVED / APPLIED / INTRODUCED — не проданы
    if ("RECEIVED".equals(upper) || "INTRODUCED".equals(upper) || "APPLIED".equals(upper)
      || "EMITTED".equals(upper)) {
      return false;
    }
    return SOLD_MARKERS.stream().anyMatch(upper::contains);
  }
}

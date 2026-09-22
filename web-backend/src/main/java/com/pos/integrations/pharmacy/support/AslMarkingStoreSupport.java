package com.pos.integrations.pharmacy.support;

import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.Set;

/** Типы магазинов, которым нужен ASL-ключ для продажи маркировки. */
public final class AslMarkingStoreSupport {

  private static final Set<String> ASL_STORE_TYPES = Set.of(
    "PHARMACY",
    "GROCERY",
    "UNIVERSAL",
    "CONSTRUCTION",
    "RESTAURANT",
    "CANTEEN"
  );

  private AslMarkingStoreSupport() {
  }

  public static boolean supportsAslMarking(String businessType) {
    if (!StringUtils.hasText(businessType)) {
      return false;
    }
    return ASL_STORE_TYPES.contains(businessType.trim().toUpperCase(Locale.ROOT));
  }

  public static boolean isPharmacy(String businessType) {
    return StringUtils.hasText(businessType)
      && "PHARMACY".equalsIgnoreCase(businessType.trim());
  }
}

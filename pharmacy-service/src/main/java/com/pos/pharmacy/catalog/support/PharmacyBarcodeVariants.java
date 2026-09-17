package com.pos.pharmacy.catalog.support;

import org.springframework.util.StringUtils;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Варианты штрихкода из скана кассы: EAN-13, GTIN-14 и GTIN из DataMatrix ASL Belgisi.
 */
public final class PharmacyBarcodeVariants {

  private static final Pattern AIM_PREFIX = Pattern.compile("^\\][A-Za-z0-9]{2}");
  private static final Pattern GTIN_AI = Pattern.compile("^01(\\d{14})");

  private PharmacyBarcodeVariants() {
  }

  public static List<String> of(String raw) {
    if (!StringUtils.hasText(raw)) {
      return List.of();
    }
    String cleaned = AIM_PREFIX.matcher(raw.trim())
      .replaceFirst("")
      .replace("\u001d", "")
      .replace("\u0000", "")
      .trim();
    if (!StringUtils.hasText(cleaned)) {
      return List.of();
    }

    LinkedHashSet<String> variants = new LinkedHashSet<>();
    addGtin(variants, extractGtin(cleaned));
    if (cleaned.length() <= 18) {
      variants.add(cleaned);
      addGtin(variants, digitsOnly(cleaned));
    }
    return List.copyOf(variants);
  }

  private static void addGtin(LinkedHashSet<String> variants, String gtin) {
    if (!StringUtils.hasText(gtin)) {
      return;
    }
    String digits = digitsOnly(gtin);
    if (digits.length() < 8 || digits.length() > 14) {
      return;
    }
    variants.add(digits);
    if (digits.length() == 14 && digits.startsWith("0")) {
      variants.add(digits.substring(1));
    }
    if (digits.length() == 14 && digits.startsWith("00")) {
      variants.add(digits.substring(2));
    }
    if (digits.length() == 13) {
      variants.add("0" + digits);
    }
    if (digits.length() == 12) {
      variants.add("0" + digits);
    }
  }

  private static String extractGtin(String cleaned) {
    Matcher matcher = GTIN_AI.matcher(cleaned);
    if (matcher.find()) {
      return matcher.group(1);
    }
    String digits = digitsOnly(cleaned);
    if (digits.length() >= 8 && digits.length() <= 14) {
      return digits;
    }
    return null;
  }

  private static String digitsOnly(String value) {
    StringBuilder digits = new StringBuilder();
    for (int i = 0; i < value.length(); i++) {
      char ch = value.charAt(i);
      if (ch >= '0' && ch <= '9') {
        digits.append(ch);
      }
    }
    return digits.toString();
  }
}

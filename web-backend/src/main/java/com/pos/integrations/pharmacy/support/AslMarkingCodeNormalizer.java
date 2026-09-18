package com.pos.integrations.pharmacy.support;

import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Нормализация КМ под Open API ASL Belgisi.
 * В endpoints public/api/cod/.../codes передаётся код идентификации без кода проверки (AI 91/92/93).
 */
public final class AslMarkingCodeNormalizer {

  private static final Pattern CRYPTO_TAIL = Pattern.compile("(91|92|93).{1,64}$");
  private static final int MIN_CODE_LENGTH = 20;

  private AslMarkingCodeNormalizer() {
  }

  public static List<String> requestCodes(String raw) {
    LinkedHashSet<String> codes = new LinkedHashSet<>();
    String trimmed = stripScannerPrefix(raw);
    if (!StringUtils.hasText(trimmed)) {
      return List.of();
    }
    String identification = toIdentificationCode(trimmed);
    if (isUsable(identification)) {
      codes.add(identification);
    }
    if (codes.isEmpty() && isUsable(trimmed)) {
      codes.add(trimmed.length() > 128 ? trimmed.substring(0, 128) : trimmed);
    }
    return new ArrayList<>(codes);
  }

  /**
   * Полный КМ для code-verification/verify (с GS и криптохвостом).
   * Сканер часто отдаёт 91/92 слитно — ASL принимает только вариант с ASCII 29.
   */
  public static String fullCodeForVerification(String raw) {
    String value = stripScannerPrefix(raw);
    if (!isUsable(value)) {
      return "";
    }
    if (value.indexOf('\u001d') >= 0) {
      return value;
    }
    String identification = toIdentificationCode(value);
    if (!isUsable(identification) || identification.length() >= value.length()) {
      return value;
    }
    String tail = value.substring(identification.length());
    return identification + '\u001d' + splitCryptoApplicationIdentifiers(tail);
  }

  /** AI 91 (4 символа) и AI 92/93 должны быть разделены GS. */
  private static String splitCryptoApplicationIdentifiers(String tail) {
    if (!StringUtils.hasText(tail)) {
      return "";
    }
    if (tail.startsWith("91") && tail.length() >= 8) {
      int afterAi91 = 6;
      if (tail.startsWith("92", afterAi91) || tail.startsWith("93", afterAi91)) {
        return tail.substring(0, afterAi91) + '\u001d' + tail.substring(afterAi91);
      }
    }
    return tail;
  }

  /** КИ без криптохвоста (для public/private codes). */
  public static String toIdentificationCode(String raw) {
    String value = stripScannerPrefix(raw);
    if (!StringUtils.hasText(value)) {
      return "";
    }
    int gs = value.indexOf('\u001d');
    if (gs >= 0) {
      value = value.substring(0, gs);
    }
    if (value.length() > 18 && value.startsWith("01") && value.startsWith("21", 16)) {
      String serialAndTail = value.substring(18);
      Matcher crypto = CRYPTO_TAIL.matcher(serialAndTail);
      if (crypto.find()) {
        return value.substring(0, 18 + crypto.start());
      }
      return value;
    }
    Matcher crypto = CRYPTO_TAIL.matcher(value);
    if (crypto.find() && crypto.start() >= MIN_CODE_LENGTH) {
      return value.substring(0, crypto.start());
    }
    return value;
  }

  private static boolean isUsable(String code) {
    return StringUtils.hasText(code) && code.length() >= MIN_CODE_LENGTH;
  }

  private static String stripScannerPrefix(String raw) {
    if (!StringUtils.hasText(raw)) {
      return "";
    }
    String trimmed = raw.replace("\uFEFF", "").replace("\u0000", "").trim();
    if (trimmed.startsWith("]") && trimmed.length() > 3) {
      trimmed = trimmed.substring(3).trim();
    }
    return trimmed;
  }
}

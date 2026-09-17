package com.pos.integrations.pharmacy.support;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AslMarkingCodeNormalizerTest {

  @Test
  void stripsCryptoAfterGs() {
    String raw = "0103077972920015217hzSaZihzGFVy\u001d93vuzv";
    assertEquals("0103077972920015217hzSaZihzGFVy", AslMarkingCodeNormalizer.toIdentificationCode(raw));
  }

  @Test
  void stripsCryptoAiWithoutGs() {
    String raw = "0103077972920015217hzSaZihzGFVy93vuzv";
    assertEquals("0103077972920015217hzSaZihzGFVy", AslMarkingCodeNormalizer.toIdentificationCode(raw));
  }

  @Test
  void requestCodesPreferIdentification() {
    List<String> codes = AslMarkingCodeNormalizer.requestCodes(
      "0103077972920015217hzSaZihzGFVy\u001d93vuzv"
    );
    assertTrue(codes.contains("0103077972920015217hzSaZihzGFVy"));
    assertEquals(1, codes.size());
  }
}

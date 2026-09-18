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

  @Test
  void stripsConcatenatedAi91And92() {
    String raw = "0108906002059409218MTGE3S706TDT91UZF092enFQOcSQ9jQzKA16EsBIzjMGF9RCYf1JZd2ReSG6eiU=";
    assertEquals("0108906002059409218MTGE3S706TDT", AslMarkingCodeNormalizer.toIdentificationCode(raw));
  }

  @Test
  void insertsGsBeforeCryptoTailForVerify() {
    String raw = "0108906002059409218MTGE3S706TDT91UZF092enFQOcSQ9jQzKA16EsBIzjMGF9RCYf1JZd2ReSG6eiU=";
    assertEquals(
      "0108906002059409218MTGE3S706TDT\u001d91UZF0\u001d92enFQOcSQ9jQzKA16EsBIzjMGF9RCYf1JZd2ReSG6eiU=",
      AslMarkingCodeNormalizer.fullCodeForVerification(raw)
    );
  }

  @Test
  void keepsExistingGsInFullCode() {
    String raw = "0103077972920015217hzSaZihzGFVy\u001d93vuzv";
    assertEquals(raw, AslMarkingCodeNormalizer.fullCodeForVerification(raw));
  }
}

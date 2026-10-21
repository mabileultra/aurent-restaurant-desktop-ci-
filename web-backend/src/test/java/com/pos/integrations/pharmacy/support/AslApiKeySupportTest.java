package com.pos.integrations.pharmacy.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AslApiKeySupportTest {

  @Test
  void stripsBearerQuotesAndInnerWhitespace() {
    assertEquals(
        "c09d906f-1111-4ae5-2222-61c0934bcd59",
        AslApiKeySupport.bearerToken("  Bearer \"c09d906f-1111-4ae5-2222-61c0934bcd59\"  ")
    );
    assertEquals(
        "c09d906f-1111-4ae5-2222-61c0934bcd59",
        AslApiKeySupport.bearerToken("c09d906f-1111-4ae5-\n2222-61c0934bcd59")
    );
  }
}

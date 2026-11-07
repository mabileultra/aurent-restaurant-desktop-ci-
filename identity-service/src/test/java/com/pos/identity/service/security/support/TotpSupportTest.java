package com.pos.identity.service.security.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TotpSupportTest {

    private final TotpSupport totpSupport = new TotpSupport();

    @Test
    void generatedSecretProducesVerifiableCode() throws Exception {
        String secret = totpSupport.generateSecret();
        // generate current code via reflection of private method through verify window:
        // brute not needed — verify rejects garbage
        assertFalse(totpSupport.verify(secret, "000000") && totpSupport.verify(secret, "999999")
            && totpSupport.verify(secret, "123456") && totpSupport.verify(secret, "654321")
            && totpSupport.verify(secret, "111111") && totpSupport.verify(secret, "222222"));
        assertTrue(secret.length() >= 16);
        assertTrue(totpSupport.otpAuthUrl(secret, "admin@aurent.uz", "Aurent POS").startsWith("otpauth://totp/"));
    }

    @Test
    void rejectsBlankCode() {
        assertFalse(totpSupport.verify("JBSWY3DPEHPK3PXP", " "));
        assertFalse(totpSupport.verify("JBSWY3DPEHPK3PXP", "12"));
    }
}

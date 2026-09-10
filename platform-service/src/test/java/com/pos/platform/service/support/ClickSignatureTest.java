package com.pos.platform.service.support;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ClickSignatureTest {

    @Test
    void md5_isStableHexDigest() {
        assertThat(ClickSignature.md5("abc")).isEqualTo("900150983cd24fb0d6963f7d28e17f72");
    }

    @Test
    void matches_ignoresCase() {
        assertThat(ClickSignature.matches("AB", "ab")).isTrue();
        assertThat(ClickSignature.matches("ab", "cd")).isFalse();
        assertThat(ClickSignature.matches(null, "ab")).isFalse();
    }
}

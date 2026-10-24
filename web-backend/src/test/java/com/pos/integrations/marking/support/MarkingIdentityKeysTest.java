package com.pos.integrations.marking.support;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MarkingIdentityKeysTest {

    private static final String NALEYKA_KM = "0104780083110808217Ф*7щгЮ93Вкф7";
    private static final String NALEYKA_KI = "0104780083110808217Ф*7щгЮ";

    @Test
    void realCyrillicPackSharesIdentificationKeyWithAndWithoutCrypto() {
        Set<String> full = MarkingIdentityKeys.keysOf(NALEYKA_KM);
        Set<String> ki = MarkingIdentityKeys.keysOf(NALEYKA_KI);
        assertTrue(full.stream().anyMatch(k -> k.startsWith("id:")));
        assertTrue(full.stream().filter(k -> k.startsWith("id:")).anyMatch(ki::contains));
    }

    @Test
    void samePackWithDifferentCryptoTailSharesIdentificationKey() {
        String base = "010307797292003921U=HqEW=YAVhNqy/Uasgl";
        Set<String> first = MarkingIdentityKeys.keysOf(base + "91EE1192ABCDEF");
        Set<String> second = MarkingIdentityKeys.keysOf(base + "\u001d91FFFF\u001d92ZZZZ");
        assertTrue(first.stream().filter(k -> k.startsWith("id:")).anyMatch(second::contains));
    }

    @Test
    void emptyRawYieldsNoKeys() {
        assertTrue(MarkingIdentityKeys.keysOf("").isEmpty());
        assertTrue(MarkingIdentityKeys.keysOf(null).isEmpty());
        assertFalse(MarkingIdentityKeys.keysOf(NALEYKA_KM).isEmpty());
    }
}

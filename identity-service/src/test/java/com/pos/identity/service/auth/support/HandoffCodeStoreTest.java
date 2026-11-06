package com.pos.identity.service.auth.support;

import com.pos.identity.dto.auth.SpaAudience;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HandoffCodeStoreTest {

    @Test
    void consumeIsOneTime() {
        HandoffCodeStore store = new HandoffCodeStore();
        UUID userId = UUID.randomUUID();
        String code = store.put(userId, SpaAudience.PHARMACY, 60);

        var first = store.consume(code);
        assertTrue(first.isPresent());
        assertEquals(userId, first.get().userId());
        assertEquals(SpaAudience.PHARMACY, first.get().audience());
        assertTrue(store.consume(code).isEmpty());
    }

    @Test
    void unknownCodeEmpty() {
        HandoffCodeStore store = new HandoffCodeStore();
        assertTrue(store.consume("nope").isEmpty());
    }
}

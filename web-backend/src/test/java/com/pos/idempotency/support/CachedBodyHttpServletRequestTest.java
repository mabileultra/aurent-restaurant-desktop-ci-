package com.pos.idempotency.support;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

class CachedBodyHttpServletRequestTest {

    @Test
    void bodyReadableTwiceAfterConstruction() throws Exception {
        byte[] payload = "{\"storeId\":1}".getBytes(StandardCharsets.UTF_8);
        MockHttpServletRequest raw = new MockHttpServletRequest("POST", "/sales");
        raw.setContent(payload);

        CachedBodyHttpServletRequest wrapped = new CachedBodyHttpServletRequest(raw);

        assertArrayEquals(payload, wrapped.getCachedBody());
        assertArrayEquals(payload, wrapped.getInputStream().readAllBytes());
        assertArrayEquals(payload, wrapped.getInputStream().readAllBytes());
        assertEquals("{\"storeId\":1}", wrapped.getReader().readLine());
    }
}

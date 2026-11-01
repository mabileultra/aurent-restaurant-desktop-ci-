package com.pos.shared.api;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PageResponseTest {

    @Test
    void computesTotalPages() {
        PageResponse<String> page = PageResponse.of(List.of("a", "b"), 0, 20, 45);
        assertEquals(3, page.totalPages());
        assertEquals(45, page.totalElements());
        assertEquals(20, page.size());
        assertEquals(0, page.number());
        assertEquals(2, page.content().size());
    }

    @Test
    void emptyHasZeroPages() {
        PageResponse<String> page = PageResponse.empty(1, 20);
        assertEquals(0, page.totalPages());
        assertEquals(0, page.totalElements());
        assertEquals(1, page.number());
    }
}

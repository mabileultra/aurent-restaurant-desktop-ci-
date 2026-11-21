package com.pos.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SqlLikeEscaperTest {

    @Test
    void escapesPercentUnderscoreAndBackslash() {
        assertEquals("a\\%b\\_c\\\\d", SqlLikeEscaper.escape("a%b_c\\d"));
    }
}

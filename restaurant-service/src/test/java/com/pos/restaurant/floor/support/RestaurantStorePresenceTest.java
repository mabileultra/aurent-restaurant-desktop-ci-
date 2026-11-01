package com.pos.restaurant.floor.support;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RestaurantStorePresenceTest {

    @Mock private JdbcTemplate jdbc;
    @InjectMocks private RestaurantStorePresence presence;

    @Test
    void trueWhenEvidenceExists() {
        when(jdbc.queryForObject(anyString(), eq(Integer.class), any(), any(), any(), any(), any(), any()))
            .thenReturn(1);
        assertThat(presence.existsForCompany(61, 55)).isTrue();
    }

    @Test
    void falseWhenMissing() {
        when(jdbc.queryForObject(anyString(), eq(Integer.class), any(), any(), any(), any(), any(), any()))
            .thenReturn(0);
        assertThat(presence.existsForCompany(61, 99)).isFalse();
    }

    @Test
    void falseOnNullArgs() {
        assertThat(presence.existsForCompany(null, 1)).isFalse();
        assertThat(presence.existsForCompany(1, null)).isFalse();
    }
}

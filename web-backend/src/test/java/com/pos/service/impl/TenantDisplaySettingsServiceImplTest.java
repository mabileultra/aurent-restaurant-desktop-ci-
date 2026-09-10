package com.pos.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.dto.tenant.TenantDisplaySettingsPayload;
import com.pos.service.support.TenantAccessSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.InvalidDataAccessResourceUsageException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TenantDisplaySettingsServiceImplTest {

    @Mock
    private TenantAccessSupport tenantAccess;
    @Mock
    private JdbcTemplate jdbcTemplate;

    private TenantDisplaySettingsServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new TenantDisplaySettingsServiceImpl(
            tenantAccess,
            new ObjectMapper(),
            jdbcTemplate
        );
    }

    @Test
    void getReturnsEmptyWhenNoRow() {
        when(tenantAccess.requireEffectiveCompanyId()).thenReturn(7);
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(7))).thenReturn(List.of());

        TenantDisplaySettingsPayload payload = service.getForCurrentCompany();

        assertThat(payload.systemAppName()).isNull();
        assertThat(payload.printSettings()).isNull();
    }

    @Test
    void getMapsValidJson() {
        when(tenantAccess.requireEffectiveCompanyId()).thenReturn(7);
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(7)))
            .thenReturn(List.of("{\"systemAppName\":\"Aurent Shop\",\"systemLogoSizePx\":40}"));

        TenantDisplaySettingsPayload payload = service.getForCurrentCompany();

        assertThat(payload.systemAppName()).isEqualTo("Aurent Shop");
        assertThat(payload.systemLogoSizePx()).isEqualTo(40);
    }

    @Test
    void getReturnsEmptyOnCorruptJson() {
        when(tenantAccess.requireEffectiveCompanyId()).thenReturn(7);
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(7)))
            .thenReturn(List.of("[1,2,3]"));

        TenantDisplaySettingsPayload payload = service.getForCurrentCompany();

        assertThat(payload.systemAppName()).isNull();
    }

    @Test
    void getReturnsEmptyWhenTableMissing() {
        when(tenantAccess.requireEffectiveCompanyId()).thenReturn(7);
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(7)))
            .thenThrow(new InvalidDataAccessResourceUsageException("relation does not exist"));

        TenantDisplaySettingsPayload payload = service.getForCurrentCompany();

        assertThat(payload.systemAppName()).isNull();
    }
}

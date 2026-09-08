package com.pos.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.dto.tenant.TenantDisplaySettingsPayload;
import com.pos.repository.CompanyTenantDisplaySettingsRepository;
import com.pos.service.support.TenantAccessSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.InvalidDataAccessResourceUsageException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TenantDisplaySettingsServiceImplTest {

    @Mock
    private CompanyTenantDisplaySettingsRepository repository;
    @Mock
    private TenantAccessSupport tenantAccess;

    private TenantDisplaySettingsServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new TenantDisplaySettingsServiceImpl(repository, tenantAccess, new ObjectMapper());
    }

    @Test
    void getReturnsEmptyWhenNoRow() {
        when(tenantAccess.requireEffectiveCompanyId()).thenReturn(7);
        when(repository.findSettingsJsonByCompanyId(7)).thenReturn(Optional.empty());

        TenantDisplaySettingsPayload payload = service.getForCurrentCompany();

        assertThat(payload.systemAppName()).isNull();
        assertThat(payload.printSettings()).isNull();
    }

    @Test
    void getMapsValidJson() {
        when(tenantAccess.requireEffectiveCompanyId()).thenReturn(7);
        when(repository.findSettingsJsonByCompanyId(7))
            .thenReturn(Optional.of("{\"systemAppName\":\"Aurent Shop\",\"systemLogoSizePx\":40}"));

        TenantDisplaySettingsPayload payload = service.getForCurrentCompany();

        assertThat(payload.systemAppName()).isEqualTo("Aurent Shop");
        assertThat(payload.systemLogoSizePx()).isEqualTo(40);
    }

    @Test
    void getReturnsEmptyOnCorruptJson() {
        when(tenantAccess.requireEffectiveCompanyId()).thenReturn(7);
        when(repository.findSettingsJsonByCompanyId(7)).thenReturn(Optional.of("[1,2,3]"));

        TenantDisplaySettingsPayload payload = service.getForCurrentCompany();

        assertThat(payload.systemAppName()).isNull();
    }

    @Test
    void getReturnsEmptyWhenTableMissing() {
        when(tenantAccess.requireEffectiveCompanyId()).thenReturn(7);
        when(repository.findSettingsJsonByCompanyId(7))
            .thenThrow(new InvalidDataAccessResourceUsageException("relation does not exist"));

        TenantDisplaySettingsPayload payload = service.getForCurrentCompany();

        assertThat(payload.systemAppName()).isNull();
    }
}

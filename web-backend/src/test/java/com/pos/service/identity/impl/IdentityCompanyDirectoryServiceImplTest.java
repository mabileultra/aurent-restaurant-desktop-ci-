package com.pos.service.identity.impl;

import com.pos.repository.CompanyRepository;
import com.pos.service.identity.support.CompanyTypeCodes;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IdentityCompanyDirectoryServiceImplTest {

    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private IdentityCompanyDirectoryServiceImpl service;

    @Test
    void blankFilterDoesNotScanAllCompanies() {
        assertTrue(service.findIds(null, " ", null).isEmpty());
        verify(companyRepository, never()).findIdsByGeo(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void retailMatchesUniversalAndRetail() {
        when(companyRepository.findIdsByTypeAndGeo(List.of("UNIVERSAL", "RETAIL"), "17", null))
            .thenReturn(List.of(4));

        assertEquals(List.of(4), service.findIds("retail", "17", null));
    }

    @Test
    void geoOnlyUsesGeoQuery() {
        when(companyRepository.findIdsByGeo("17", "1701")).thenReturn(List.of(9));

        assertEquals(List.of(9), service.findIds(null, "17", "1701"));
    }

    @Test
    void expandRetail() {
        assertEquals(List.of("UNIVERSAL", "RETAIL"), CompanyTypeCodes.expand("RETAIL"));
    }
}

package com.pos.service.platform.impl;

import com.pos.dto.platform.internal.CompanySyncRequest;
import com.pos.entity.Company;
import com.pos.repository.CompanyRepository;
import com.pos.service.CompanyBusinessTypeAssignmentService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlatformCompanySyncServiceImplTest {

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private CompanyBusinessTypeAssignmentService companyBusinessTypeAssignmentService;

    @InjectMocks
    private PlatformCompanySyncServiceImpl service;

    @Test
    void flushesCompanyBeforeBusinessTypeRows() {
        when(companyRepository.findById(132)).thenReturn(Optional.empty());
        when(companyRepository.saveAndFlush(any(Company.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.sync(new CompanySyncRequest(
            "UPSERT", 132, "Apteka", null, null, null, null, null, null, null, "PHARMACY", true));

        InOrder order = inOrder(companyRepository, companyBusinessTypeAssignmentService);
        order.verify(companyRepository).saveAndFlush(any(Company.class));
        order.verify(companyBusinessTypeAssignmentService).syncFromLegacyType(eq(132), anyString());
    }

    @Test
    void deleteDoesNotWriteBusinessTypes() {
        when(companyRepository.findById(132)).thenReturn(Optional.empty());

        service.sync(new CompanySyncRequest(
            "DELETE", 132, null, null, null, null, null, null, null, null, null, false));

        verify(companyBusinessTypeAssignmentService, never()).syncFromLegacyType(any(), any());
        verify(companyRepository, never()).saveAndFlush(any());
    }
}

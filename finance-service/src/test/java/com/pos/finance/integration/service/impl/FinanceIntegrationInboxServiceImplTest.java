package com.pos.finance.integration.service.impl;

import com.pos.finance.integration.entity.FinanceIntegrationInbox;
import com.pos.finance.integration.repository.FinanceIntegrationInboxRepository;
import com.pos.finance.integration.service.FinanceIntegrationInboxService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FinanceIntegrationInboxServiceImplTest {

    @Mock
    private FinanceIntegrationInboxRepository repository;

    @InjectMocks
    private FinanceIntegrationInboxServiceImpl service;

    @Test
    void alreadyProcessedWhenExists() {
        when(repository.existsById("k1")).thenReturn(true);
        assertTrue(service.alreadyProcessed("k1"));
    }

    @Test
    void markProcessedSavesOnce() {
        when(repository.existsById("k1")).thenReturn(false);
        service.markProcessed("k1", "SALE");
        ArgumentCaptor<FinanceIntegrationInbox> captor = ArgumentCaptor.forClass(FinanceIntegrationInbox.class);
        verify(repository).save(captor.capture());
        assertEquals("k1", captor.getValue().getIdempotencyKey());
        assertEquals("SALE", captor.getValue().getEventType());
    }

    @Test
    void blankKeySkipped() {
        assertFalse(service.alreadyProcessed(" "));
        service.markProcessed(" ", "SALE");
        verify(repository, never()).save(any());
    }
}

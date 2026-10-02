package com.pos.restaurant.localfirst.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.localfirst.domain.LocalEventIngestOutcome;
import com.pos.restaurant.localfirst.dto.IngestLocalEventRequest;
import com.pos.restaurant.localfirst.dto.IngestLocalEventResponse;
import com.pos.restaurant.localfirst.entity.DeviceClientEvent;
import com.pos.restaurant.localfirst.repository.DeviceClientEventRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LocalEventIngestServiceImplTest {

    @Mock private DeviceClientEventRepository repository;
    @Mock private FloorTenantSupport tenantSupport;
    @Mock private LocalEventApplicator applicator;

    @InjectMocks private LocalEventIngestServiceImpl service;

    private final ObjectMapper mapper = new ObjectMapper();

    private IngestLocalEventRequest req(String eventId) {
        ObjectNode payload = mapper.createObjectNode().put("orderId", "ord-1");
        return new IngestLocalEventRequest("POS-01", eventId, "ORDER_SEND_KITCHEN", payload);
    }

    @Test
    void firstIngestIsAccepted() {
        when(tenantSupport.requireCompanyId()).thenReturn(10);
        when(repository.existsByCompanyIdAndDeviceIdAndClientEventId(10, "POS-01", "evt-1"))
            .thenReturn(false);
        when(repository.save(any(DeviceClientEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        IngestLocalEventResponse res = service.ingest(1, req("evt-1"));

        assertEquals(LocalEventIngestOutcome.ACCEPTED, res.outcome());
        ArgumentCaptor<DeviceClientEvent> cap = ArgumentCaptor.forClass(DeviceClientEvent.class);
        verify(repository).save(cap.capture());
        assertEquals("evt-1", cap.getValue().getClientEventId());
        assertEquals(10, cap.getValue().getCompanyId());
        assertEquals(1, cap.getValue().getStoreId());
    }

    @Test
    void duplicateIngestIsAlreadyProcessedWithoutSecondSaveEffect() {
        when(tenantSupport.requireCompanyId()).thenReturn(10);
        when(repository.existsByCompanyIdAndDeviceIdAndClientEventId(10, "POS-01", "evt-1"))
            .thenReturn(true);

        IngestLocalEventResponse res = service.ingest(1, req("evt-1"));

        assertEquals(LocalEventIngestOutcome.ALREADY_PROCESSED, res.outcome());
        verify(repository, never()).save(any());
    }

    @Test
    void concurrentUniqueViolationBecomesAlreadyProcessed() {
        when(tenantSupport.requireCompanyId()).thenReturn(10);
        when(repository.existsByCompanyIdAndDeviceIdAndClientEventId(10, "POS-01", "evt-2"))
            .thenReturn(false);
        when(repository.save(any(DeviceClientEvent.class)))
            .thenThrow(new DataIntegrityViolationException("uk_rst_device_client_event"));

        IngestLocalEventResponse res = service.ingest(1, req("evt-2"));

        assertEquals(LocalEventIngestOutcome.ALREADY_PROCESSED, res.outcome());
    }
}

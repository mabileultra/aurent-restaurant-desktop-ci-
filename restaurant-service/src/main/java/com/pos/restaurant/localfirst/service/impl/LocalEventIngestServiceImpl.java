package com.pos.restaurant.localfirst.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.localfirst.domain.LocalEventIngestOutcome;
import com.pos.restaurant.localfirst.dto.IngestLocalEventRequest;
import com.pos.restaurant.localfirst.dto.IngestLocalEventResponse;
import com.pos.restaurant.localfirst.entity.DeviceClientEvent;
import com.pos.restaurant.localfirst.repository.DeviceClientEventRepository;
import com.pos.restaurant.localfirst.service.LocalEventIngestService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LocalEventIngestServiceImpl implements LocalEventIngestService {

    private final DeviceClientEventRepository repository;
    private final FloorTenantSupport tenantSupport;
    private final LocalEventApplicator applicator;

    @Override
    @Transactional
    public IngestLocalEventResponse ingest(Integer storeId, IngestLocalEventRequest request) {
        Integer companyId = tenantSupport.requireCompanyId();
        if (storeId == null) {
            throw new IllegalArgumentException("store_id_required");
        }

        String deviceId = request.deviceId().trim();
        String clientEventId = request.clientEventId().trim();
        String eventType = request.eventType().trim();
        String payloadJson = request.payload() == null ? "{}" : request.payload().toString();

        if (repository.existsByCompanyIdAndDeviceIdAndClientEventId(companyId, deviceId, clientEventId)) {
            return new IngestLocalEventResponse(
                LocalEventIngestOutcome.ALREADY_PROCESSED,
                deviceId,
                clientEventId
            );
        }

        try {
            repository.save(DeviceClientEvent.builder()
                .companyId(companyId)
                .storeId(storeId)
                .deviceId(deviceId)
                .clientEventId(clientEventId)
                .eventType(eventType)
                .payload(payloadJson)
                .build());
            applicator.apply(companyId, storeId, eventType, payloadJson);
            return new IngestLocalEventResponse(
                LocalEventIngestOutcome.ACCEPTED,
                deviceId,
                clientEventId
            );
        } catch (DataIntegrityViolationException ex) {
            // Concurrent duplicate insert — at-most-once business effect.
            return new IngestLocalEventResponse(
                LocalEventIngestOutcome.ALREADY_PROCESSED,
                deviceId,
                clientEventId
            );
        }
    }
}

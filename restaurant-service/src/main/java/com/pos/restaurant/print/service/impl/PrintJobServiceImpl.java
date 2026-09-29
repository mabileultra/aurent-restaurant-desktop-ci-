package com.pos.restaurant.print.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.print.domain.PrintJobStatus;
import com.pos.restaurant.print.dto.AckPrintJobsRequest;
import com.pos.restaurant.print.dto.PrintJobResponse;
import com.pos.restaurant.print.entity.RestaurantPrintJob;
import com.pos.restaurant.print.repository.RestaurantPrintJobRepository;
import com.pos.restaurant.print.service.PrintJobService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PrintJobServiceImpl implements PrintJobService {

    private static final int POLL_LOOKBACK_HOURS = 6;

    private final RestaurantPrintJobRepository repository;
    private final FloorTenantSupport tenantSupport;

    @Override
    @Transactional(readOnly = true)
    public List<PrintJobResponse> pollPending(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        Instant since = Instant.now().minus(POLL_LOOKBACK_HOURS, ChronoUnit.HOURS);
        return repository.findPendingForStore(companyId, storeId, PrintJobStatus.PENDING, since).stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional
    public void acknowledge(Integer storeId, AckPrintJobsRequest request) {
        Integer companyId = tenantSupport.requireCompanyId();
        repository.markDone(
            request.jobIds(),
            companyId,
            storeId,
            PrintJobStatus.PENDING,
            PrintJobStatus.DONE,
            Instant.now()
        );
    }

    private PrintJobResponse toResponse(RestaurantPrintJob job) {
        return new PrintJobResponse(job.getId(), job.getKind(), job.getPayload(), job.getCreatedAt());
    }
}

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
import java.util.EnumSet;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PrintJobServiceImpl implements PrintJobService {

    private static final int POLL_LOOKBACK_HOURS = 6;
    private static final int CLAIM_BATCH = 25;
    /** If a desktop dies mid-print, job becomes claimable again. */
    private static final int CLAIM_STALE_SECONDS = 90;

    private final RestaurantPrintJobRepository repository;
    private final FloorTenantSupport tenantSupport;

    @Override
    @Transactional
    public List<PrintJobResponse> pollPending(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        Instant now = Instant.now();
        Instant since = now.minus(POLL_LOOKBACK_HOURS, ChronoUnit.HOURS);
        Instant staleBefore = now.minus(CLAIM_STALE_SECONDS, ChronoUnit.SECONDS);

        repository.reclaimStaleClaims(companyId, storeId, staleBefore);
        List<UUID> claimedIds = repository.claimPendingIds(
            companyId,
            storeId,
            since,
            now,
            CLAIM_BATCH
        );
        if (claimedIds == null || claimedIds.isEmpty()) {
            return List.of();
        }
        return repository.findAllByIdOrdered(claimedIds).stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional
    public void acknowledge(Integer storeId, AckPrintJobsRequest request) {
        if (request.jobIds() == null || request.jobIds().isEmpty()) {
            return;
        }
        Integer companyId = tenantSupport.requireCompanyId();
        repository.markDoneFromStatuses(
            request.jobIds(),
            companyId,
            storeId,
            EnumSet.of(PrintJobStatus.CLAIMED, PrintJobStatus.PENDING),
            PrintJobStatus.DONE,
            Instant.now()
        );
    }

    private PrintJobResponse toResponse(RestaurantPrintJob job) {
        return new PrintJobResponse(job.getId(), job.getKind(), job.getPayload(), job.getCreatedAt());
    }
}

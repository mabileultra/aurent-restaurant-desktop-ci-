package com.pos.restaurant.print.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.print.domain.PrintJobStatus;
import com.pos.restaurant.print.dto.AckPrintJobsRequest;
import com.pos.restaurant.print.dto.ClaimPrintJobsRequest;
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
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PrintJobServiceImpl implements PrintJobService {

    private static final int POLL_LOOKBACK_HOURS = 6;
    private static final int CLAIM_BATCH = 25;
    /** Old desktops send no per-printer cap: keep their backlog per lane under CLAIM_STALE_SECONDS. */
    private static final int DEFAULT_PER_PRINTER = 4;
    /** If a desktop dies mid-print, job becomes claimable again (release API is preferred). */
    private static final int CLAIM_STALE_SECONDS = 45;

    /** Older bills are never printed: the cashier already printed it locally or the guest is gone. */
    private static final int GUEST_BILL_TTL_MINUTES = 5;
    /** Older kitchen / station slips are never printed: a desktop back after hours must not dump its backlog. */
    private static final int KITCHEN_SLIP_TTL_MINUTES = 20;

    private final RestaurantPrintJobRepository repository;
    private final FloorTenantSupport tenantSupport;

    private void expireStale(Integer companyId, Integer storeId, Instant now) {
        repository.expireStalePending(
            companyId,
            storeId,
            now.minus(GUEST_BILL_TTL_MINUTES, ChronoUnit.MINUTES),
            now.minus(KITCHEN_SLIP_TTL_MINUTES, ChronoUnit.MINUTES),
            now
        );
    }

    @Override
    @Transactional
    public List<PrintJobResponse> pollPending(Integer storeId) {
        return claimUnfiltered(storeId);
    }

    @Override
    @Transactional
    public List<PrintJobResponse> claimPending(Integer storeId, ClaimPrintJobsRequest request) {
        if (request == null) {
            return List.of();
        }
        boolean guestBill = request.guestBill();
        boolean orderCancel = request.orderCancel();
        boolean kitchenSend = request.kitchenSend();
        boolean pickupLabel = request.pickupLabel();
        List<String> printers = normalizePrinters(request.printerNames());
        List<String> busy = normalizePrinters(request.busyPrinters());
        if (!guestBill && !orderCancel && !kitchenSend && !pickupLabel && printers.isEmpty()) {
            return List.of();
        }

        Integer companyId = tenantSupport.requireCompanyId();
        Instant now = Instant.now();
        Instant since = now.minus(POLL_LOOKBACK_HOURS, ChronoUnit.HOURS);
        Instant staleBefore = now.minus(CLAIM_STALE_SECONDS, ChronoUnit.SECONDS);

        repository.reclaimStaleClaims(companyId, storeId, staleBefore);
        expireStale(companyId, storeId, now);
        // Native IN () needs at least one bind value when hasPrinters is false.
        List<String> printerBind = printers.isEmpty() ? List.of("__none__") : printers;
        List<UUID> claimedIds = repository.claimPendingFilteredIds(
            companyId,
            storeId,
            since,
            now,
            claimBatch(request.limit()),
            perPrinterLimit(request.perPrinterLimit()),
            guestBill ? 1 : 0,
            orderCancel ? 1 : 0,
            kitchenSend ? 1 : 0,
            pickupLabel ? 1 : 0,
            printers.isEmpty() ? 0 : 1,
            printerBind,
            busy.isEmpty() ? List.of("__none__") : busy
        );
        if (claimedIds == null || claimedIds.isEmpty()) {
            return List.of();
        }
        return repository.findAllByIdOrdered(claimedIds).stream()
            .map(this::toResponse)
            .toList();
    }

    private List<PrintJobResponse> claimUnfiltered(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        Instant now = Instant.now();
        Instant since = now.minus(POLL_LOOKBACK_HOURS, ChronoUnit.HOURS);
        Instant staleBefore = now.minus(CLAIM_STALE_SECONDS, ChronoUnit.SECONDS);

        repository.reclaimStaleClaims(companyId, storeId, staleBefore);
        expireStale(companyId, storeId, now);
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

    @Override
    @Transactional
    public void release(Integer storeId, AckPrintJobsRequest request) {
        if (request.jobIds() == null || request.jobIds().isEmpty()) {
            return;
        }
        Integer companyId = tenantSupport.requireCompanyId();
        repository.releaseClaims(companyId, storeId, request.jobIds());
    }

    private static int claimBatch(Integer limit) {
        if (limit == null || limit <= 0) {
            return CLAIM_BATCH;
        }
        return Math.min(limit, CLAIM_BATCH);
    }

    private static int perPrinterLimit(Integer limit) {
        if (limit == null || limit <= 0) {
            return DEFAULT_PER_PRINTER;
        }
        return Math.min(limit, CLAIM_BATCH);
    }

    private static List<String> normalizePrinters(List<String> names) {
        if (names == null) {
            return List.of();
        }
        return names.stream()
            .filter(name -> name != null && !name.isBlank())
            .map(name -> name.trim().toLowerCase(Locale.ROOT))
            .distinct()
            .toList();
    }

    private PrintJobResponse toResponse(RestaurantPrintJob job) {
        return new PrintJobResponse(job.getId(), job.getKind(), job.getPayload(), job.getCreatedAt());
    }
}

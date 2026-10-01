package com.pos.restaurant.print.controller;

import com.pos.restaurant.print.dto.AckPrintJobsRequest;
import com.pos.restaurant.print.dto.ClaimPrintJobsRequest;
import com.pos.restaurant.print.dto.PrintJobResponse;
import com.pos.restaurant.print.service.PrintJobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/rst")
@RequiredArgsConstructor
@Tag(name = "Restaurant print relay", description = "Очередь печати для десктопных станций")
public class PrintJobController {

    private final PrintJobService printJobService;

    @GetMapping("/stores/{storeId}/print-jobs/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'COOK')")
    @Operation(summary = "Задания на печать для десктопа (poll, без фильтра — legacy)")
    public List<PrintJobResponse> pollPending(@PathVariable Integer storeId) {
        return printJobService.pollPending(storeId);
    }

    @PostMapping("/stores/{storeId}/print-jobs/claim")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'COOK')")
    @Operation(summary = "Забрать задания под принтеры этой станции")
    public List<PrintJobResponse> claimPending(
        @PathVariable Integer storeId,
        @RequestBody(required = false) ClaimPrintJobsRequest request
    ) {
        return printJobService.claimPending(
            storeId,
            request != null ? request : new ClaimPrintJobsRequest(List.of(), false, false, null, null, null)
        );
    }

    @PostMapping("/stores/{storeId}/print-jobs/ack")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'COOK')")
    @Operation(summary = "Подтвердить выполненную печать")
    public void acknowledge(
        @PathVariable Integer storeId,
        @Valid @RequestBody AckPrintJobsRequest request
    ) {
        printJobService.acknowledge(storeId, request);
    }

    @PostMapping("/stores/{storeId}/print-jobs/release")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'COOK')")
    @Operation(summary = "Вернуть задание в очередь (не наш принтер / сбой)")
    public void release(
        @PathVariable Integer storeId,
        @Valid @RequestBody AckPrintJobsRequest request
    ) {
        printJobService.release(storeId, request);
    }
}

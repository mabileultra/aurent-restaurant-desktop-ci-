package com.pos.integrations.pharmacy.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.integrations.pharmacy.domain.AslRequestOperation;
import com.pos.integrations.pharmacy.domain.AslRequestOutcome;
import com.pos.integrations.pharmacy.dto.AslRequestLogItemResponse;
import com.pos.integrations.pharmacy.service.AslRequestLogQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/admin/asl-request-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPER_ADMIN')")
@Tag(name = "ASL Request Logs", description = "Журнал исходящих запросов в ASL Belgisi")
@StandardApiResponses
public class AdminAslRequestLogController {

  private final AslRequestLogQueryService queryService;

  @GetMapping
  @Operation(summary = "Список запросов в ASL (фильтры: магазин, операция, ушло/не ушло, период)")
  public ResponseEntity<Page<AslRequestLogItemResponse>> list(
      @RequestParam(required = false) Integer storeId,
      @RequestParam(required = false) AslRequestOperation operation,
      @RequestParam(required = false) AslRequestOutcome outcome,
      @RequestParam(required = false) Boolean reached,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
      @RequestParam(required = false) String search,
      @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
  ) {
    return ResponseEntity.ok(queryService.search(
        storeId,
        operation,
        outcome,
        reached,
        from,
        to,
        search,
        pageable
    ));
  }
}

package com.pos.integrations.pharmacy.service.impl;

import com.pos.entity.Store;
import com.pos.integrations.pharmacy.domain.AslRequestOperation;
import com.pos.integrations.pharmacy.domain.AslRequestOutcome;
import com.pos.integrations.pharmacy.dto.AslRequestLogItemResponse;
import com.pos.integrations.pharmacy.entity.AslRequestLog;
import com.pos.integrations.pharmacy.repository.AslRequestLogRepository;
import com.pos.integrations.pharmacy.service.AslRequestLogQueryService;
import com.pos.repository.StoreRepository;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AslRequestLogQueryServiceImpl implements AslRequestLogQueryService {

  private final AslRequestLogRepository repository;
  private final StoreRepository storeRepository;
  private final TenantAccessSupport tenantAccess;

  @Override
  @Transactional(readOnly = true)
  public Page<AslRequestLogItemResponse> search(
      Integer storeId,
      AslRequestOperation operation,
      AslRequestOutcome outcome,
      Boolean reached,
      Instant from,
      Instant to,
      String search,
      Pageable pageable
  ) {
    Integer companyId = tenantAccess.requireEffectiveCompanyId();
    if (storeId != null) {
      Store store = storeRepository.findById(storeId)
          .orElseThrow(() -> new com.pos.exception.ResourceNotFoundException("Store not found"));
      tenantAccess.assertCanAccessStore(store);
    }
    String searchPattern = StringUtils.hasText(search)
        ? "%" + search.trim().toLowerCase() + "%"
        : "";
    // PostgreSQL + Hibernate: null Instant / CONCAT('%', null, '%') → lower(bytea) / untyped params.
    Instant fromBound = from != null ? from : Instant.EPOCH;
    Instant toBound = to != null ? to : Instant.now().plus(3650, ChronoUnit.DAYS);
    Page<AslRequestLog> page = repository.search(
        companyId,
        storeId,
        operation,
        outcome,
        reached,
        fromBound,
        toBound,
        searchPattern,
        pageable
    );
    Map<Integer, String> storeNames = loadStoreNames(page.getContent());
    return page.map(row -> toResponse(row, storeNames.get(row.getStoreId())));
  }

  private Map<Integer, String> loadStoreNames(List<AslRequestLog> rows) {
    Set<Integer> ids = rows.stream()
        .map(AslRequestLog::getStoreId)
        .filter(Objects::nonNull)
        .collect(Collectors.toSet());
    if (ids.isEmpty()) {
      return Map.of();
    }
    Map<Integer, String> names = new HashMap<>();
    storeRepository.findAllById(ids).forEach(store -> names.put(store.getId(), store.getName()));
    return names;
  }

  private static AslRequestLogItemResponse toResponse(AslRequestLog row, String storeName) {
    return new AslRequestLogItemResponse(
        row.getId(),
        row.getStoreId(),
        storeName,
        row.getOperation(),
        row.getOutcome(),
        row.isReached(),
        row.getHttpStatus(),
        row.getEndpoint(),
        row.getMarkCodeShort(),
        row.getAslStatus(),
        row.getMessage(),
        row.getDurationMs(),
        row.getCreatedAt()
    );
  }
}

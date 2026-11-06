package com.pos.pharmacy.warehouse.service.impl;

import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.common.TenantSupport;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyInventoryErrors;
import com.pos.pharmacy.warehouse.dto.CreatePharmacyInventoryRequest;
import com.pos.pharmacy.warehouse.dto.PharmacyInventoryResponse;
import com.pos.pharmacy.warehouse.entity.StockInventory;
import com.pos.pharmacy.warehouse.repository.StockInventoryRepository;
import com.pos.pharmacy.warehouse.service.PharmacyStockInventoryService;
import com.pos.pharmacy.warehouse.support.PharmacyInventoryResponseMapper;
import com.pos.pharmacy.warehouse.support.PharmacyInventoryWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PharmacyStockInventoryServiceImpl implements PharmacyStockInventoryService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final TenantSupport tenantSupport;
    private final PharmacyInventoryWriter inventoryWriter;
    private final StockInventoryRepository stockInventoryRepository;
    private final PharmacyInventoryResponseMapper responseMapper;

    @Override
    @Transactional
    public PharmacyInventoryResponse create(CreatePharmacyInventoryRequest request) {
        Integer companyId = tenantSupport.requireCompanyId();
        StockInventory saved = inventoryWriter.create(companyId, tenantSupport.currentUserId(), request);
        return responseMapper.toResponse(
            stockInventoryRepository.findDetailedById(saved.getId(), companyId).orElse(saved)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PharmacyInventoryResponse getById(UUID id) {
        Integer companyId = tenantSupport.requireCompanyId();
        StockInventory inventory = stockInventoryRepository.findDetailedById(id, companyId)
            .orElseThrow(() -> PharmacyErrors.notFound(PharmacyInventoryErrors.PHARM_INVENTORY_NOT_FOUND));
        return responseMapper.toResponse(inventory);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PharmacyInventoryResponse> list(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Pageable pageable
    ) {
        Integer companyId = tenantSupport.requireCompanyId();
        Instant fromTs = from.atStartOfDay(ZONE).toInstant();
        Instant toTs = to.plusDays(1).atStartOfDay(ZONE).toInstant();
        Page<StockInventory> page = stockInventoryRepository.findBetween(
            companyId, fromTs, toTs, storeId, pageable
        );
        return PageResponse.from(page.map(responseMapper::toSummary));
    }
}

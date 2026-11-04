package com.pos.pharmacy.warehouse.service;

import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.warehouse.dto.CreatePharmacyInventoryRequest;
import com.pos.pharmacy.warehouse.dto.PharmacyInventoryResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

public interface PharmacyStockInventoryService {

    PharmacyInventoryResponse create(CreatePharmacyInventoryRequest request);

    PharmacyInventoryResponse getById(UUID id);

    PageResponse<PharmacyInventoryResponse> list(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Pageable pageable
    );
}

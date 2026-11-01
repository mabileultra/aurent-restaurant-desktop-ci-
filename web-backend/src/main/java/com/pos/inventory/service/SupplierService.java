package com.pos.inventory.service;

import com.pos.dto.shared.PageResponse;
import com.pos.inventory.dto.supplier.CreateSupplierRequest;
import com.pos.inventory.dto.supplier.SupplierResponse;
import com.pos.inventory.dto.supplier.UpdateSupplierRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

public interface SupplierService {

    PageResponse<SupplierResponse> list(String search, LocalDate createdOn, Pageable pageable);

    SupplierResponse create(CreateSupplierRequest req);

    SupplierResponse update(UUID id, UpdateSupplierRequest req);

    void delete(UUID id);
}

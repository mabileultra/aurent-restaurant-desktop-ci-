package com.pos.pharmacy.warehouse.service;

import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.warehouse.dto.CreatePharmacyTransferFromReceiptRequest;
import com.pos.pharmacy.warehouse.dto.CreatePharmacyTransferRequest;
import com.pos.pharmacy.warehouse.dto.PharmacyTransferResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

public interface PharmacyStockTransferService {

    PharmacyTransferResponse create(CreatePharmacyTransferRequest request);

    PharmacyTransferResponse createFromReceipt(CreatePharmacyTransferFromReceiptRequest request);

    PharmacyTransferResponse getById(UUID id);

    PageResponse<PharmacyTransferResponse> list(
        LocalDate from,
        LocalDate to,
        Integer fromStoreId,
        Integer toStoreId,
        Pageable pageable
    );
}

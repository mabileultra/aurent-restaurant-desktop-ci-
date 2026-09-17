package com.pos.pharmacy.warehouse.service;

import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.warehouse.dto.CreatePharmacyStockReceiptRequest;
import com.pos.pharmacy.warehouse.dto.PharmacyReceiptRevalueRequest;
import com.pos.pharmacy.warehouse.dto.PharmacyStockReceiptLineRequest;
import com.pos.pharmacy.warehouse.dto.PharmacyStockReceiptResponse;
import com.pos.pharmacy.warehouse.dto.UpdatePharmacyStockReceiptRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface PharmacyStockReceiptService {

    PharmacyStockReceiptResponse createDraft(CreatePharmacyStockReceiptRequest request);

    PharmacyStockReceiptResponse updateDraft(UUID id, UpdatePharmacyStockReceiptRequest request);

    PharmacyStockReceiptResponse getById(UUID id);

    PageResponse<PharmacyStockReceiptResponse> list(Integer storeId, String status, String search, Pageable pageable);

    PharmacyStockReceiptResponse replaceLines(UUID id, List<PharmacyStockReceiptLineRequest> lines);

    PharmacyStockReceiptResponse addLine(UUID id, PharmacyStockReceiptLineRequest line);

    PharmacyStockReceiptResponse addLines(UUID id, List<PharmacyStockReceiptLineRequest> lines);

    PharmacyStockReceiptResponse updateLine(UUID id, UUID lineId, PharmacyStockReceiptLineRequest line);

    PharmacyStockReceiptResponse revalueLines(UUID id, PharmacyReceiptRevalueRequest request);

    PharmacyStockReceiptResponse removeLine(UUID id, UUID lineId);

    void deleteDraft(UUID id);

    PharmacyStockReceiptResponse activate(UUID id);
}

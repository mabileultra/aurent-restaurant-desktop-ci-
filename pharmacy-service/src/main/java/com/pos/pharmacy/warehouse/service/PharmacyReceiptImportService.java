package com.pos.pharmacy.warehouse.service;

import com.pos.pharmacy.warehouse.dto.PharmacyStockReceiptResponse;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportConfirmRequest;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportMatchRequest;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportMatchResponse;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportParseResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface PharmacyReceiptImportService {

    PharmacyImportParseResponse parse(UUID receiptId, MultipartFile file);

    PharmacyImportMatchResponse match(UUID receiptId, PharmacyImportMatchRequest request);

    PharmacyStockReceiptResponse confirm(UUID receiptId, PharmacyImportConfirmRequest request);
}

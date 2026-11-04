package com.pos.pharmacy.warehouse.service.impl;

import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.common.TenantSupport;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyTransferErrors;
import com.pos.pharmacy.warehouse.dto.CreatePharmacyTransferFromReceiptRequest;
import com.pos.pharmacy.warehouse.dto.CreatePharmacyTransferRequest;
import com.pos.pharmacy.warehouse.dto.PharmacyTransferResponse;
import com.pos.pharmacy.warehouse.entity.StockTransfer;
import com.pos.pharmacy.warehouse.repository.StockTransferRepository;
import com.pos.pharmacy.warehouse.service.PharmacyStockTransferService;
import com.pos.pharmacy.warehouse.support.PharmacyTransferFromReceiptWriter;
import com.pos.pharmacy.warehouse.support.PharmacyTransferLinesWriter;
import com.pos.pharmacy.warehouse.support.PharmacyTransferResponseMapper;
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
public class PharmacyStockTransferServiceImpl implements PharmacyStockTransferService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final TenantSupport tenantSupport;
    private final PharmacyTransferFromReceiptWriter fromReceiptWriter;
    private final PharmacyTransferLinesWriter linesWriter;
    private final StockTransferRepository stockTransferRepository;
    private final PharmacyTransferResponseMapper responseMapper;

    @Override
    @Transactional
    public PharmacyTransferResponse create(CreatePharmacyTransferRequest request) {
        Integer companyId = tenantSupport.requireCompanyId();
        StockTransfer saved = linesWriter.create(companyId, tenantSupport.currentUserId(), request);
        return responseMapper.toResponse(
            stockTransferRepository.findDetailedById(saved.getId(), companyId).orElse(saved)
        );
    }

    @Override
    @Transactional
    public PharmacyTransferResponse createFromReceipt(CreatePharmacyTransferFromReceiptRequest request) {
        Integer companyId = tenantSupport.requireCompanyId();
        StockTransfer saved = fromReceiptWriter.create(companyId, tenantSupport.currentUserId(), request);
        return responseMapper.toResponse(
            stockTransferRepository.findDetailedById(saved.getId(), companyId).orElse(saved)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PharmacyTransferResponse getById(UUID id) {
        Integer companyId = tenantSupport.requireCompanyId();
        StockTransfer transfer = stockTransferRepository.findDetailedById(id, companyId)
            .orElseThrow(() -> PharmacyErrors.notFound(PharmacyTransferErrors.PHARM_TRANSFER_NOT_FOUND, id));
        return responseMapper.toResponse(transfer);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PharmacyTransferResponse> list(
        LocalDate from,
        LocalDate to,
        Integer fromStoreId,
        Integer toStoreId,
        Pageable pageable
    ) {
        Integer companyId = tenantSupport.requireCompanyId();
        Instant start = from.atStartOfDay(ZONE).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZONE).toInstant();
        Page<StockTransfer> page = stockTransferRepository.findBetween(
            companyId, start, end, fromStoreId, toStoreId, pageable
        );
        return PageResponse.from(page.map(responseMapper::toSummary));
    }
}

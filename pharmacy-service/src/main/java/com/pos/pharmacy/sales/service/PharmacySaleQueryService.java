package com.pos.pharmacy.sales.service;

import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.security.PharmacyTenantContext;
import com.pos.pharmacy.sales.dto.SaleResponse;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.repository.SaleRepository;
import com.pos.pharmacy.sales.support.SaleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PharmacySaleQueryService {

    private final SaleRepository saleRepository;
    private final SaleMapper saleMapper;

    public SaleResponse getByReceiptNumber(String receiptNumber) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        Sale sale = saleRepository.findByReceiptNumberAndCompanyId(receiptNumber, companyId)
            .orElseThrow(() -> PharmacyErrors.notFound("Sale receipt", receiptNumber));
        return saleMapper.toResponse(sale);
    }

    public SaleResponse getById(UUID id) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        Sale sale = saleRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> PharmacyErrors.notFound("Sale", id));
        return saleMapper.toResponse(sale);
    }

    public PageResponse<SaleResponse> mySales(Integer storeId, UUID shiftId, Pageable pageable) {
        UUID cashierId = PharmacyTenantContext.getUserId();
        Integer companyId = PharmacyTenantContext.getCompanyId();
        Page<Sale> page = saleRepository.findMySales(companyId, cashierId, storeId, shiftId, pageable);
        return PageResponse.from(page.map(saleMapper::toResponse));
    }
}

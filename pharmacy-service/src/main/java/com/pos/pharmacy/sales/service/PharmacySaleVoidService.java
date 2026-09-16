package com.pos.pharmacy.sales.service;

import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.revenue.service.PharmacyRevenuePublicationService;
import com.pos.pharmacy.security.PharmacyTenantContext;
import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.pharmacy.sales.dto.SaleResponse;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.repository.SaleRepository;
import com.pos.pharmacy.sales.support.SaleMapper;
import com.pos.pharmacy.util.QuantityUtil;
import com.pos.pharmacy.warehouse.service.StoreStockService;
import com.pos.pharmacy.warehouse.support.PharmacyLotFefoSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PharmacySaleVoidService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final StoreStockService storeStockService;
    private final PharmacyLotFefoSupport pharmacyLotFefoSupport;
    private final SaleMapper saleMapper;
    private final PharmacyRevenuePublicationService revenuePublicationService;

    public SaleResponse voidSale(UUID id, String reason) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        Sale sale = saleRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> PharmacyErrors.notFound("Sale", id));

        if (sale.getStatus() == SaleEnums.SaleStatus.VOIDED) {
            throw PharmacyErrors.badRequest("Sale already voided");
        }

        String r = reason != null ? reason : "";
        boolean anyRemaining = false;

        for (var item : sale.getItems()) {
            BigDecimal remaining = QuantityUtil.subtract(item.getQuantity(), item.getReturnedQuantity());
            if (remaining.signum() <= 0) {
                continue;
            }
            anyRemaining = true;
            var product = item.getProduct();
            storeStockService.increase(product, sale.getStoreId(), remaining);
            pharmacyLotFefoSupport.restorePartial(item, remaining);
            productRepository.save(product);
            item.setReturnedQuantity(item.getQuantity());
        }

        if (!anyRemaining && PharmacySalePartialReturnService.allItemsFullyReturned(sale)) {
            throw PharmacyErrors.badRequest("Чек уже полностью возвращён");
        }

        sale.setStatus(SaleEnums.SaleStatus.VOIDED);
        String prev = sale.getNotes();
        sale.setNotes(prev != null && !prev.isBlank() ? prev + " | VOID: " + r : "VOID: " + r);

        Sale saved = saleRepository.save(sale);
        revenuePublicationService.onSaleCompleted(saved, java.util.Map.of(), null);
        return saleMapper.toResponse(saved);
    }
}

package com.pos.pharmacy.sync.service;

import com.pos.pharmacy.catalog.dto.ProductResponse;
import com.pos.pharmacy.catalog.service.ProductCatalogService;
import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyCommonErrors;
import com.pos.pharmacy.sales.dto.SaleResponse;
import com.pos.pharmacy.sales.repository.SaleRepository;
import com.pos.pharmacy.sales.service.PharmacySaleCheckoutService;
import com.pos.pharmacy.sales.support.OfflineSaleContext;
import com.pos.pharmacy.security.PharmacyTenantContext;
import com.pos.pharmacy.shift.support.PharmacyShiftLookup;
import com.pos.pharmacy.sync.dto.*;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PharmacyCashierSyncService {

    private static final int BOOTSTRAP_PAGE_SIZE = 500;

    private final ProductCatalogService productCatalogService;
    private final PharmacySaleCheckoutService checkoutService;
    private final SaleRepository saleRepository;
    private final PharmacyShiftLookup shiftLookup;

    @Transactional(readOnly = true)
    public PharmacySyncBootstrapResponse bootstrap(Integer storeId) {
        if (storeId == null) {
            throw PharmacyErrors.of(PharmacyCommonErrors.PHARM_STORE_REQUIRED);
        }
        if (PharmacyTenantContext.getCompanyId() == null) {
            throw PharmacyErrors.of(PharmacyCommonErrors.PHARM_COMPANY_REQUIRED);
        }

        String storeName = shiftLookup.findOpen(storeId)
            .map(s -> s.getStoreName() != null ? s.getStoreName() : "")
            .orElse("");

        List<ProductResponse> products = new ArrayList<>();
        int page = 0;
        while (true) {
            PageResponse<ProductResponse> chunk = productCatalogService.list(
                null,
                true,
                storeId,
                PageRequest.of(page, BOOTSTRAP_PAGE_SIZE)
            );
            if (chunk.content() == null || chunk.content().isEmpty()) {
                break;
            }
            products.addAll(chunk.content());
            if (page + 1 >= chunk.totalPages()) {
                break;
            }
            page += 1;
        }

        Map<Integer, PharmacySyncCategoryDto> categories = new LinkedHashMap<>();
        for (ProductResponse product : products) {
            if (product.categoryId() == null) {
                continue;
            }
            categories.putIfAbsent(
                product.categoryId(),
                new PharmacySyncCategoryDto(product.categoryId(), product.categoryName())
            );
        }

        LogUtil.info(
            PharmacyCashierSyncService.class,
            "Pharmacy offline bootstrap: storeId={}, products={}, categories={}",
            storeId,
            products.size(),
            categories.size()
        );

        return new PharmacySyncBootstrapResponse(
            storeId,
            storeName,
            List.copyOf(categories.values()),
            products,
            Instant.now()
        );
    }

    @Transactional
    public OfflineSalesBatchResponse syncSalesBatch(OfflineSalesBatchRequest request, UUID cashierId) {
        if (cashierId == null) {
            throw PharmacyErrors.of(PharmacyCommonErrors.PHARM_CASHIER_REQUIRED);
        }
        List<OfflineSaleSyncResult> results = new ArrayList<>();
        for (OfflineSaleSyncItem item : request.sales()) {
            results.add(syncOneSale(item, cashierId));
        }
        return new OfflineSalesBatchResponse(results);
    }

    private OfflineSaleSyncResult syncOneSale(OfflineSaleSyncItem item, UUID cashierId) {
        try {
            return saleRepository.findByClientSaleId(item.clientSaleId())
                .map(existing -> new OfflineSaleSyncResult(
                    item.clientSaleId(),
                    existing.getId(),
                    existing.getReceiptNumber(),
                    "ALREADY_EXISTS",
                    null
                ))
                .orElseGet(() -> createOfflineSale(item, cashierId));
        } catch (Exception ex) {
            LogUtil.warn(
                PharmacyCashierSyncService.class,
                "Pharmacy offline sale sync failed clientSaleId={}: {}",
                item.clientSaleId(),
                ex.getMessage()
            );
            return new OfflineSaleSyncResult(
                item.clientSaleId(),
                null,
                null,
                "FAILED",
                ex.getMessage()
            );
        }
    }

    private OfflineSaleSyncResult createOfflineSale(OfflineSaleSyncItem item, UUID cashierId) {
        OfflineSaleContext offline = new OfflineSaleContext(
            item.clientSaleId(),
            item.offlineDeviceId(),
            item.createdAt()
        );
        SaleResponse created = checkoutService.processSale(item.sale(), cashierId, offline);
        return new OfflineSaleSyncResult(
            item.clientSaleId(),
            created.id(),
            created.receiptNumber(),
            "CREATED",
            null
        );
    }
}

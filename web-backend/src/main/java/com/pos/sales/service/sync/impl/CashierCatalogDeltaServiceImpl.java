package com.pos.sales.service.sync.impl;

import com.pos.catalog.dto.category.CategoryResponse;
import com.pos.catalog.dto.product.ProductResponse;
import com.pos.catalog.service.CategoryService;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.UserRepository;
import com.pos.sales.dto.sync.CashierSyncCatalogDeltaResponse;
import com.pos.sales.service.sync.CashierCatalogDeltaService;
import com.pos.sales.service.sync.support.CashierCatalogDeltaProductSupport;
import com.pos.sales.service.sync.support.CatalogDeltaPolicy;
import com.pos.service.support.CashierSaleSupport;
import com.pos.service.support.CatalogIsolationSupport;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CashierCatalogDeltaServiceImpl implements CashierCatalogDeltaService {

    private final UserRepository userRepository;
    private final CashierSaleSupport cashierSaleSupport;
    private final CatalogIsolationSupport catalogIsolation;
    private final CategoryService categoryService;
    private final CashierCatalogDeltaProductSupport productSupport;

    @Override
    public CashierSyncCatalogDeltaResponse delta(Integer storeId, UUID cashierId, Instant since) {
        User cashier = userRepository.findByIdWithDetails(cashierId)
            .orElseThrow(() -> new ResourceNotFoundException("Cashier not found"));
        Store store = cashierSaleSupport.requireStoreForSale(cashier, storeId);
        assertStoreMatchesCashierCompany(cashier, store);
        catalogIsolation.rejectPharmacySalesInMonolith(store);

        Instant syncedAt = Instant.now();
        if (CatalogDeltaPolicy.requiresFullReset(since, syncedAt)) {
            LogUtil.info(
                CashierCatalogDeltaServiceImpl.class,
                "Offline catalog delta fullReset: storeId={}, since={}",
                store.getId(),
                since
            );
            return CashierSyncCatalogDeltaResponse.fullReset(
                store.getId(),
                store.getName(),
                since,
                syncedAt
            );
        }

        Integer companyId = store.getCompany().getId();
        List<CategoryResponse> categories = categoryService.findAll(null);
        List<ProductResponse> products = productSupport.loadActiveUpserts(companyId, store.getId(), since);
        List<UUID> removed = productSupport.loadRemovedIds(companyId, since);

        LogUtil.info(
            CashierCatalogDeltaServiceImpl.class,
            "Offline catalog delta: storeId={}, upserts={}, removed={}, categories={}",
            store.getId(),
            products.size(),
            removed.size(),
            categories.size()
        );

        return new CashierSyncCatalogDeltaResponse(
            store.getId(),
            store.getName(),
            since,
            syncedAt,
            false,
            categories,
            products,
            removed
        );
    }

    private void assertStoreMatchesCashierCompany(User cashier, Store store) {
        if (cashier.getCompany() == null || store.getCompany() == null) {
            return;
        }
        if (!cashier.getCompany().getId().equals(store.getCompany().getId())) {
            throw new BadRequestException("Store does not belong to cashier company");
        }
    }
}

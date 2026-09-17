package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.catalog.service.PharmacyProductService;
import com.pos.pharmacy.exception.PharmacyException;
import com.pos.pharmacy.security.PharmacyTenantContext;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportConfirmItem;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/** Параллельно создаёт карточки из строк фактуры, не теряя компанию запроса. */
@Component
public class PharmacyImportProductWriter {

    private final PharmacyProductService pharmacyProductService;
    private final ProductRepository productRepository;
    private final PharmacyImportProductFactory productFactory;
    private final PharmacyMassExecutor massExecutor;

    public PharmacyImportProductWriter(
        PharmacyProductService pharmacyProductService,
        ProductRepository productRepository,
        PharmacyImportProductFactory productFactory,
        PharmacyMassExecutor massExecutor
    ) {
        this.pharmacyProductService = pharmacyProductService;
        this.productRepository = productRepository;
        this.productFactory = productFactory;
        this.massExecutor = massExecutor;
    }

    public List<UUID> write(
        List<PharmacyImportConfirmItem> items,
        Integer storeId,
        String invoiceId,
        Integer companyId
    ) {
        UUID userId = PharmacyTenantContext.getUserId();
        String role = PharmacyTenantContext.getRole();
        List<CompletableFuture<UUID>> futures = new ArrayList<>();
        for (PharmacyImportConfirmItem item : items) {
            futures.add(CompletableFuture.supplyAsync(
                () -> writeOne(item, storeId, invoiceId, companyId, userId, role),
                massExecutor.executor()
            ));
        }
        List<UUID> ids = new ArrayList<>(futures.size());
        for (int i = 0; i < futures.size(); i++) {
            try {
                ids.add(futures.get(i).join());
            } catch (RuntimeException ex) {
                futures.forEach(future -> future.cancel(true));
                Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
                if (cause instanceof PharmacyException pharmacyException) {
                    throw pharmacyException;
                }
                PharmacyImportConfirmItem item = items.get(i);
                throw new IllegalStateException(
                    "Строка " + (item.rowIndex() + 1) + " («" + item.excelName() + "»): " + cause.getMessage(),
                    cause
                );
            }
        }
        return ids;
    }

    private UUID writeOne(
        PharmacyImportConfirmItem item,
        Integer storeId,
        String invoiceId,
        Integer companyId,
        UUID userId,
        String role
    ) {
        PharmacyTenantContext.set(companyId, userId, role);
        try {
            String sku = productFactory.sku(invoiceId, item);
            return productRepository.findByCompanyIdAndSku(companyId, sku)
                .map(product -> applyRetail(product, item))
                .orElseGet(() -> pharmacyProductService.create(
                    productFactory.request(item, storeId, invoiceId, companyId)
                ).id());
        } finally {
            PharmacyTenantContext.clear();
        }
    }

    private UUID applyRetail(Product product, PharmacyImportConfirmItem item) {
        if (item.purchasePrice() != null) {
            product.setCostPrice(item.purchasePrice());
        }
        if (item.retailPrice() != null && item.retailPrice().compareTo(new BigDecimal("0.01")) >= 0) {
            product.setSellingPrice(item.retailPrice());
        }
        if (item.vatPercent() != null) {
            product.setTaxRate(item.vatPercent());
        }
        return productRepository.save(product).getId();
    }
}

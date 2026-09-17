package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.catalog.service.PharmacyProductService;
import com.pos.pharmacy.exception.PharmacyException;
import com.pos.pharmacy.security.PharmacyTenantContext;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportConfirmItem;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Параллельно создаёт карточки из строк фактуры, не теряя компанию запроса. */
@Component
public class PharmacyImportProductWriter {

    private static final int THREADS = 4;

    private final PharmacyProductService pharmacyProductService;
    private final ProductRepository productRepository;
    private final PharmacyImportProductFactory productFactory;
    private final ExecutorService executor = Executors.newFixedThreadPool(THREADS);

    public PharmacyImportProductWriter(
        PharmacyProductService pharmacyProductService,
        ProductRepository productRepository,
        PharmacyImportProductFactory productFactory
    ) {
        this.pharmacyProductService = pharmacyProductService;
        this.productRepository = productRepository;
        this.productFactory = productFactory;
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
                executor
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
                .map(product -> product.getId())
                .orElseGet(() -> pharmacyProductService.create(
                    productFactory.request(item, storeId, invoiceId, companyId)
                ).id());
        } finally {
            PharmacyTenantContext.clear();
        }
    }
}

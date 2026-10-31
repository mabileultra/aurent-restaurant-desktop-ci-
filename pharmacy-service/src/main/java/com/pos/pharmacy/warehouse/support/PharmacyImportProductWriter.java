package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.catalog.service.PharmacyProductService;
import com.pos.pharmacy.catalog.service.ProductAttributeService;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.PharmacyException;
import com.pos.pharmacy.exception.errorcode.PharmacySqlConstraintError;
import com.pos.pharmacy.security.PharmacyTenantContext;
import com.pos.pharmacy.support.PharmacyDbFieldLimits;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportConfirmItem;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;

/** Параллельно создаёт карточки из строк фактуры, не теряя компанию запроса. */
@Component
public class PharmacyImportProductWriter {

    private final PharmacyProductService pharmacyProductService;
    private final ProductRepository productRepository;
    private final ProductAttributeService productAttributeService;
    private final PharmacyImportProductFactory productFactory;
    private final PharmacyMassExecutor massExecutor;

    public PharmacyImportProductWriter(
        PharmacyProductService pharmacyProductService,
        ProductRepository productRepository,
        ProductAttributeService productAttributeService,
        PharmacyImportProductFactory productFactory,
        PharmacyMassExecutor massExecutor
    ) {
        this.pharmacyProductService = pharmacyProductService;
        this.productRepository = productRepository;
        this.productAttributeService = productAttributeService;
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
                throw mapWriteFailure(items.get(i), unwrap(ex));
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
                .orElseGet(() -> createOrReuse(item, storeId, invoiceId, companyId, sku));
        } finally {
            PharmacyTenantContext.clear();
        }
    }

    /** Параллельный create гоняет unique(sku): при гонке берём уже созданную карточку. */
    private UUID createOrReuse(
        PharmacyImportConfirmItem item,
        Integer storeId,
        String invoiceId,
        Integer companyId,
        String sku
    ) {
        try {
            return pharmacyProductService.create(
                productFactory.request(item, storeId, invoiceId, companyId)
            ).id();
        } catch (DataIntegrityViolationException ex) {
            return productRepository.findByCompanyIdAndSku(companyId, sku)
                .map(product -> applyRetail(product, item))
                .orElseThrow(() -> ex);
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
            product.setTaxRate(PharmacyDbFieldLimits.vatPercent(item.vatPercent()));
        }
        if (item.markedProduct()) {
            product.setMarkedProduct(true);
        }
        if (StringUtils.hasText(item.packageCode())) {
            product.setPackageCode(PharmacyDbFieldLimits.packageCode(item.packageCode()));
        }
        if (StringUtils.hasText(item.ikpuStatus())) {
            product.setIkpuStatus(PharmacyDbFieldLimits.ikpuStatus(item.ikpuStatus()));
        }
        if (item.prescriptionRequired() != null) {
            Map<String, String> attrs = new LinkedHashMap<>(
                productAttributeService.getAttributes(product.getId())
            );
            if (Boolean.TRUE.equals(item.prescriptionRequired())) {
                attrs.put(PharmacyReceiptSupport.ATTR_PRESCRIPTION_REQUIRED, "true");
            } else {
                attrs.remove(PharmacyReceiptSupport.ATTR_PRESCRIPTION_REQUIRED);
            }
            productAttributeService.saveAttributes(product.getId(), attrs);
        }
        return productRepository.save(product).getId();
    }

    private static Throwable unwrap(Throwable error) {
        Throwable current = error;
        int depth = 0;
        while (current instanceof CompletionException && current.getCause() != null && depth < 8) {
            current = current.getCause();
            depth++;
        }
        return current != null ? current : error;
    }

    private static RuntimeException mapWriteFailure(PharmacyImportConfirmItem item, Throwable cause) {
        if (cause instanceof PharmacyException pharmacyException) {
            return pharmacyException;
        }
        if (cause instanceof DataIntegrityViolationException integrity) {
            return PharmacyErrors.of(PharmacySqlConstraintError.of(integrity));
        }
        String detail = cause.getMessage() != null ? cause.getMessage() : cause.getClass().getSimpleName();
        return new IllegalStateException(
            "Строка " + (item.rowIndex() + 1) + " («" + item.excelName() + "»): " + detail,
            cause
        );
    }
}

package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class PharmacyImportMatchSupport {

    private final ProductRepository productRepository;

    public Optional<Product> findInvoiceDuplicate(Integer companyId, String invoiceId) {
        String id = normalizeInvoiceId(invoiceId);
        if (id == null) {
            return Optional.empty();
        }
        Optional<Product> byDoc = productRepository.findFirstByCompanyIdAndUzInvoiceDocumentId(companyId, id);
        if (byDoc.isPresent()) {
            return byDoc;
        }
        return productRepository.findFirstByCompanyIdAndSkuStartingWith(companyId, id + "-L-");
    }

    public boolean isInvoiceImported(Integer companyId, String invoiceId) {
        return findInvoiceDuplicate(companyId, invoiceId).isPresent();
    }

    public static String normalizeInvoiceId(String invoiceId) {
        if (!StringUtils.hasText(invoiceId)) {
            return null;
        }
        return invoiceId.trim().toUpperCase(Locale.ROOT);
    }

    public static String duplicateMessage(String invoiceId) {
        String id = normalizeInvoiceId(invoiceId);
        return id == null ? null : "Счёт-фактура " + id + " уже импортирована";
    }
}

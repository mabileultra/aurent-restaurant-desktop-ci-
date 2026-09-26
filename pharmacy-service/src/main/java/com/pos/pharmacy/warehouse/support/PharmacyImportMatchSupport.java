package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.util.ProductImportParseUtil;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

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

    /** Фактура уже есть в каталоге, но не в этом черновике — чужой импорт. */
    public boolean isImportedOnAnotherReceipt(Integer companyId, StockReceipt receipt, String invoiceId) {
        return isInvoiceImported(companyId, invoiceId) && !receiptOwnsInvoice(receipt, invoiceId);
    }

    /**
     * Этот черновик уже ведёт фактуру: номер совпал или в строках есть её карточки.
     * Следующая пачка импорта (строки 81+) должна пройти, даже если номер на документе другой.
     */
    public static boolean receiptOwnsInvoice(StockReceipt receipt, String invoiceId) {
        String id = normalizeInvoiceId(invoiceId);
        if (id == null || receipt == null) {
            return false;
        }
        if (id.equals(normalizeInvoiceId(receipt.getInvoiceNumber()))) {
            return true;
        }
        if (receipt.getLines() == null) {
            return false;
        }
        String prefix = id + "-L-";
        for (StockReceiptLine line : receipt.getLines()) {
            Product product = line.getProduct();
            if (product == null) {
                continue;
            }
            if (id.equals(normalizeInvoiceId(product.getUzInvoiceDocumentId()))) {
                return true;
            }
            String sku = product.getSku();
            if (sku != null && sku.toUpperCase(Locale.ROOT).startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    public Set<String> savedInvoiceSkus(Integer companyId, String invoiceId, int rowCount) {
        String id = normalizeInvoiceId(invoiceId);
        if (companyId == null || id == null || rowCount <= 0) {
            return Set.of();
        }
        List<String> skus = new ArrayList<>(rowCount);
        for (int rowNum = 1; rowNum <= rowCount; rowNum++) {
            skus.add(ProductImportParseUtil.resolveUzInvoiceSku(id, rowNum));
        }
        Set<String> saved = new HashSet<>();
        for (Product product : productRepository.findByCompanyIdAndSkuIn(companyId, skus)) {
            if (StringUtils.hasText(product.getSku())) {
                saved.add(product.getSku().toUpperCase(Locale.ROOT));
            }
        }
        return saved;
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

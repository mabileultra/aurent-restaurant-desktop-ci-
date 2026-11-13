package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.registry.support.DrugRegistryCardFill;
import com.pos.pharmacy.importing.spreadsheet.parser.ExcelBarcodeText;
import com.pos.pharmacy.importing.spreadsheet.parser.pdf.DidoxInvoiceFooterFilter;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportMatchItem;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Разбор одной строки Excel/Didox → PharmacyImportMatchItem (+ матч каталога по штрихкоду). */
@Component
@RequiredArgsConstructor
public class PharmacyImportRowMapper {

    private static final String STATUS_NEW = "NEW";
    private static final String STATUS_DUPLICATE = "DUPLICATE";
    private static final String STATUS_MATCHED = "MATCHED";

    private final PharmacyImportTasnifEnricher tasnifEnricher;
    private final PharmacyImportCatalogMatcher catalogMatcher;
    private final DrugRegistryCardFill drugRegistry;

    public PharmacyImportMatchItem map(
        int rowIndex,
        List<String> row,
        Map<String, Integer> roles,
        BigDecimal defaultMarkup,
        boolean useFinalSums,
        boolean rowDuplicate,
        String invoiceId,
        Integer companyId
    ) {
        String name = PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.NAME);
        if (!StringUtils.hasText(name) || DidoxInvoiceFooterFilter.isFooterText(name)) {
            return null;
        }
        String manufacturer = PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.MANUFACTURER);
        String country = PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.COUNTRY);
        String barcode = ExcelBarcodeText.normalize(
            PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.BARCODE)
        );
        String ikpu = PharmacyImportIkpu.code(
            PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.IKPU)
        );
        PharmacyImportTasnifHit tasnifHit = null;
        if (!StringUtils.hasText(ikpu)) {
            tasnifHit = drugRegistry.resolveTasnif(barcode, null, name);
            if (tasnifHit != null && tasnifHit.found() && StringUtils.hasText(tasnifHit.mxik())) {
                ikpu = PharmacyImportIkpu.code(tasnifHit.mxik());
            }
        }
        String batch = PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.BATCH);
        LocalDate expiry = PharmacyImportValueParser.date(
            PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.EXPIRY)
        );
        if (expiry == null) {
            expiry = PharmacyImportBatchExpiry.fromBatch(batch).orElse(null);
        }
        BigDecimal qty = PharmacyImportValueParser.decimal(
            PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.QTY)
        );
        BigDecimal vat = PharmacyImportPercent.vatRate(PharmacyImportValueParser.decimal(
            PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.VAT_RATE)
        ));
        BigDecimal purchase = PharmacyImportValueParser.decimal(
            PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.PURCHASE)
        );
        BigDecimal purchaseWithVat = PharmacyImportValueParser.decimal(
            PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.PURCHASE_WITH_VAT)
        );
        if (purchase == null && purchaseWithVat != null) {
            purchase = PharmacyReceiptPricing.withoutVat(purchaseWithVat, vat);
        }
        if (purchase == null) {
            purchase = BigDecimal.ZERO;
        }
        BigDecimal markupPercent = roles.get(PharmacyImportRoles.MARKUP) == null
            ? null
            : PharmacyImportValueParser.decimal(
                PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.MARKUP)
            );
        BigDecimal retailRaw = PharmacyImportValueParser.decimal(
            PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.RETAIL)
        );
        BigDecimal retail = PharmacyImportRetailResolve.resolve(purchase, vat, markupPercent, retailRaw, qty);
        if (retail == null) {
            BigDecimal base = purchaseWithVat != null ? purchaseWithVat : PharmacyReceiptPricing.withVat(purchase, vat);
            retail = base.multiply(BigDecimal.ONE.add(defaultMarkup.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)))
                .setScale(2, RoundingMode.HALF_UP);
        }
        if (useFinalSums && qty != null && qty.compareTo(BigDecimal.ZERO) > 0) {
            purchase = purchase.divide(qty, 2, RoundingMode.HALF_UP);
            if (markupPercent == null) {
                retail = retail.divide(qty, 2, RoundingMode.HALF_UP);
            }
        }
        BigDecimal units = PharmacyImportValueParser.decimal(
            PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.UNITS_IN_PACK)
        );
        List<String> markCodes = PharmacyImportMarkCodesParser.parse(
            PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.MARK_CODES)
        );
        Boolean prescription = PharmacyImportInvoiceRxLook.of(
            PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.PRESCRIPTION)
        );
        boolean invoiceMarked = PharmacyImportInvoiceMarkLook.of(row);
        PharmacyImportCatalogHints hints = tasnifEnricher.apply(ikpu, invoiceMarked, prescription);
        DrugRegistryCardFill.Official official = drugRegistry.blanks(
            name,
            manufacturer,
            country,
            hints.prescriptionRequired()
        );

        UUIDFields catalog = rowDuplicate
            ? UUIDFields.empty()
            : resolveCatalog(companyId, barcode);

        return new PharmacyImportMatchItem(
            rowIndex,
            name,
            official.manufacturer(),
            official.country(),
            catalog.status(rowDuplicate),
            catalog.message(rowDuplicate, invoiceId),
            catalog.productId(),
            catalog.productName(),
            qty,
            purchase,
            vat,
            retail,
            blankToNull(batch),
            expiry,
            blankToNull(barcode),
            blankToNull(ikpu),
            units,
            markCodes,
            hints.markedProduct(),
            official.prescription(),
            hints.packageCode(),
            hints.ikpuStatus()
        );
    }

    private UUIDFields resolveCatalog(Integer companyId, String barcode) {
        Optional<Product> existing = catalogMatcher.findExisting(companyId, barcode);
        if (existing.isEmpty()) {
            return UUIDFields.empty();
        }
        Product product = existing.get();
        return new UUIDFields(product.getId(), product.getName());
    }

    private static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private record UUIDFields(java.util.UUID productId, String productName) {
        static UUIDFields empty() {
            return new UUIDFields(null, null);
        }

        String status(boolean rowDuplicate) {
            if (rowDuplicate) {
                return STATUS_DUPLICATE;
            }
            return productId != null ? STATUS_MATCHED : STATUS_NEW;
        }

        String message(boolean rowDuplicate, String invoiceId) {
            if (rowDuplicate) {
                return PharmacyImportMatchSupport.duplicateMessage(invoiceId);
            }
            if (productId == null) {
                return null;
            }
            return "Найден в каталоге — количество добавится в приход"
                + (StringUtils.hasText(productName) ? ": " + productName : "");
        }
    }
}

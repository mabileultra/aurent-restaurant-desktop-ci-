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
import java.util.Set;
import java.util.UUID;

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
        return map(
            rowIndex,
            row,
            roles,
            defaultMarkup,
            useFinalSums,
            invoiceId,
            companyId,
            null,
            Set.of(),
            rowDuplicate
        );
    }

    public PharmacyImportMatchItem map(
        int rowIndex,
        List<String> row,
        Map<String, Integer> roles,
        BigDecimal defaultMarkup,
        boolean useFinalSums,
        String invoiceId,
        Integer companyId,
        Product preferredProduct,
        Set<UUID> productIdsOnDraft
    ) {
        return map(
            rowIndex, row, roles, defaultMarkup, useFinalSums, invoiceId, companyId,
            preferredProduct, productIdsOnDraft, false
        );
    }

    private PharmacyImportMatchItem map(
        int rowIndex,
        List<String> row,
        Map<String, Integer> roles,
        BigDecimal defaultMarkup,
        boolean useFinalSums,
        String invoiceId,
        Integer companyId,
        Product preferredProduct,
        Set<UUID> productIdsOnDraft,
        boolean forceInvoiceDuplicate
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
        BigDecimal purchaseRaw = PharmacyImportValueParser.decimal(
            PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.PURCHASE)
        );
        BigDecimal purchaseWithVat = PharmacyImportValueParser.decimal(
            PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.PURCHASE_WITH_VAT)
        );
        BigDecimal purchase = PharmacyImportPurchaseResolve.unitWithoutVat(
            purchaseRaw, purchaseWithVat, vat, qty
        );
        BigDecimal markupPercent = roles.get(PharmacyImportRoles.MARKUP) == null
            ? null
            : PharmacyImportValueParser.decimal(
                PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.MARKUP)
            );
        BigDecimal retailRaw = PharmacyImportValueParser.decimal(
            PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.RETAIL)
        );
        BigDecimal didoxTotal = PharmacyImportDidoxAmounts.lineTotalWithVat(row,
            roles.getOrDefault(PharmacyImportRoles.PURCHASE, -1),
            roles.getOrDefault(PharmacyImportRoles.QTY, -1),
            roles.getOrDefault(PharmacyImportRoles.RETAIL, -1),
            roles.getOrDefault(PharmacyImportRoles.VAT_RATE, -1));
        BigDecimal retail;
        if (didoxTotal != null) {
            retail = useFinalSums
                ? didoxTotal.divide(qty, 2, RoundingMode.HALF_UP)
                : PharmacyReceiptPricing.withVat(retailRaw, vat);
        } else if (useFinalSums && qty != null && qty.signum() > 0) {
            BigDecimal vatFactor = BigDecimal.ONE.add(vat.movePointLeft(2));
            BigDecimal purchaseTotalWithVat = purchaseWithVat != null
                ? purchaseWithVat
                : purchase.multiply(vatFactor);
            BigDecimal markup = markupPercent != null ? markupPercent : defaultMarkup;
            BigDecimal retailTotal = retailRaw != null
                ? retailRaw
                : purchaseTotalWithVat.multiply(BigDecimal.ONE.add(markup.movePointLeft(2)));
            if (purchaseRaw == null && purchaseWithVat != null) {
                purchase = purchaseWithVat.divide(qty.multiply(vatFactor), 2, RoundingMode.HALF_UP);
            } else if (purchaseWithVat == null) {
                purchase = purchase.divide(qty, 2, RoundingMode.HALF_UP);
            }
            retail = retailTotal.divide(qty, 2, RoundingMode.HALF_UP);
        } else {
            retail = PharmacyImportRetailResolve.resolve(purchase, vat, markupPercent, retailRaw, qty);
            if (retail == null) {
                BigDecimal unitGross = PharmacyImportPurchaseWithVat.unitFromCell(
                    purchaseWithVat, purchaseRaw, qty
                );
                BigDecimal base = unitGross != null
                    ? unitGross
                    : PharmacyReceiptPricing.withVat(purchase, vat);
                retail = PharmacyReceiptPricing.retailFromMarkup(base, defaultMarkup);
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

        UUIDFields catalog = resolveCatalog(
            companyId,
            barcode,
            ikpu,
            preferredProduct,
            productIdsOnDraft == null ? Set.of() : productIdsOnDraft,
            forceInvoiceDuplicate,
            invoiceId
        );

        return new PharmacyImportMatchItem(
            rowIndex,
            name,
            official.manufacturer(),
            official.country(),
            catalog.status(),
            catalog.message(),
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

    private UUIDFields resolveCatalog(
        Integer companyId,
        String barcode,
        String ikpu,
        Product preferredProduct,
        Set<UUID> productIdsOnDraft,
        boolean forceInvoiceDuplicate,
        String invoiceId
    ) {
        if (forceInvoiceDuplicate) {
            return new UUIDFields(
                null, null, STATUS_DUPLICATE, PharmacyImportMatchSupport.duplicateMessage(invoiceId)
            );
        }
        if (preferredProduct != null) {
            if (productIdsOnDraft.contains(preferredProduct.getId())) {
                return onReceipt(preferredProduct);
            }
            return matched(preferredProduct, "Найден по предыдущему импорту фактуры — количество добавится в приход");
        }
        Optional<Product> existing = catalogMatcher.findExisting(companyId, barcode, ikpu);
        if (existing.isEmpty()) {
            return UUIDFields.empty();
        }
        Product product = existing.get();
        if (productIdsOnDraft.contains(product.getId())) {
            return onReceipt(product);
        }
        return matched(product, "Найден в каталоге — количество добавится в приход");
    }

    private static UUIDFields onReceipt(Product product) {
        return new UUIDFields(
            product.getId(),
            product.getName(),
            STATUS_DUPLICATE,
            PharmacyImportMatchSupport.alreadyOnReceiptMessage()
        );
    }

    private static UUIDFields matched(Product product, String prefix) {
        String message = prefix + (StringUtils.hasText(product.getName()) ? ": " + product.getName() : "");
        return new UUIDFields(product.getId(), product.getName(), STATUS_MATCHED, message);
    }

    private static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private record UUIDFields(
        java.util.UUID productId,
        String productName,
        String status,
        String message
    ) {
        static UUIDFields empty() {
            return new UUIDFields(null, null, STATUS_NEW, null);
        }
    }
}

package com.pos.pharmacy.warehouse.service.impl;

import com.pos.pharmacy.common.TenantSupport;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyCommonErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyReceiptErrors;
import com.pos.pharmacy.warehouse.dto.PharmacyStockReceiptLineRequest;
import com.pos.pharmacy.warehouse.dto.PharmacyStockReceiptResponse;
import com.pos.pharmacy.warehouse.dto.importing.*;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.repository.StockReceiptRepository;
import com.pos.pharmacy.warehouse.service.PharmacyReceiptImportService;
import com.pos.pharmacy.warehouse.service.PharmacyStockReceiptService;
import com.pos.pharmacy.config.PharmacyExecutorNames;
import com.pos.pharmacy.support.PharmacyParallelTasks;
import com.pos.pharmacy.warehouse.support.*;
import com.pos.pharmacy.importing.spreadsheet.parser.ExcelBarcodeText;
import com.pos.pharmacy.importing.spreadsheet.parser.pdf.DidoxInvoiceFooterFilter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executor;
import java.util.function.Supplier;

@Service
@Transactional
public class PharmacyReceiptImportServiceImpl implements PharmacyReceiptImportService {

    private static final String STATUS_NEW = "NEW";
    private static final String STATUS_DUPLICATE = "DUPLICATE";

    private final StockReceiptRepository stockReceiptRepository;
    private final TenantSupport tenant;
    private final PharmacyReceiptSupport pharmacyReceipt;
    private final PharmacyImportGridSupport gridSupport;
    private final PharmacyImportMatchSupport matchSupport;
    private final PharmacyStockReceiptService pharmacyStockReceiptService;
    private final PharmacyImportProductWriter productWriter;
    private final PharmacyImportTasnifEnricher tasnifEnricher;
    private final Executor importExecutor;

    public PharmacyReceiptImportServiceImpl(
        StockReceiptRepository stockReceiptRepository,
        TenantSupport tenant,
        PharmacyReceiptSupport pharmacyReceipt,
        PharmacyImportGridSupport gridSupport,
        PharmacyImportMatchSupport matchSupport,
        PharmacyStockReceiptService pharmacyStockReceiptService,
        PharmacyImportProductWriter productWriter,
        PharmacyImportTasnifEnricher tasnifEnricher,
        @Qualifier(PharmacyExecutorNames.IMPORT) Executor importExecutor
    ) {
        this.stockReceiptRepository = stockReceiptRepository;
        this.tenant = tenant;
        this.pharmacyReceipt = pharmacyReceipt;
        this.gridSupport = gridSupport;
        this.matchSupport = matchSupport;
        this.pharmacyStockReceiptService = pharmacyStockReceiptService;
        this.productWriter = productWriter;
        this.tasnifEnricher = tasnifEnricher;
        this.importExecutor = importExecutor;
    }

    @Override
    @Transactional(readOnly = true)
    public PharmacyImportParseResponse parse(UUID receiptId, MultipartFile file) {
        requireDraft(receiptId);
        Integer companyId = tenant.requireCompanyId();
        List<List<String>> grid = gridSupport.readGrid(file);
        int headerRow = gridSupport.findHeaderRow(grid);
        String invoiceId = PharmacyImportMatchSupport.normalizeInvoiceId(gridSupport.extractInvoiceId(grid));
        List<List<String>> rows = gridSupport.dataRows(grid, headerRow);
        return new PharmacyImportParseResponse(
            file.getOriginalFilename(),
            headerRow,
            invoiceId,
            matchSupport.isInvoiceImported(companyId, invoiceId),
            gridSupport.columns(grid.get(headerRow), rows),
            rows
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PharmacyImportMatchResponse match(UUID receiptId, PharmacyImportMatchRequest request) {
        StockReceipt receipt = requireDraft(receiptId);
        Integer companyId = tenant.requireCompanyId();
        String invoiceId = PharmacyImportMatchSupport.normalizeInvoiceId(request.uzInvoiceDocumentId());
        boolean invoiceImported = matchSupport.isInvoiceImported(companyId, invoiceId);
        List<List<String>> rows = request.rows() != null ? request.rows() : List.of();
        Map<String, Integer> roles = PharmacyImportRoleMap.normalize(
            request.roles(),
            PharmacyImportRoleMap.rowWidth(rows)
        );
        BigDecimal defaultMarkup = receipt.getDefaultMarkupPercent() != null
            ? receipt.getDefaultMarkupPercent()
            : new BigDecimal("20");
        List<Supplier<PharmacyImportMatchItem>> tasks = new ArrayList<>(rows.size());
        for (int i = 0; i < rows.size(); i++) {
            final int rowIndex = i;
            final List<String> row = rows.get(i);
            tasks.add(() -> mapRow(
                rowIndex, row, roles, defaultMarkup, request.useFinalSums(), invoiceImported, invoiceId
            ));
        }
        List<PharmacyImportMatchItem> items = PharmacyParallelTasks.supplyAll(tasks, importExecutor).stream()
            .filter(item -> item != null)
            .sorted(Comparator.comparingInt(PharmacyImportMatchItem::rowIndex))
            .toList();
        return new PharmacyImportMatchResponse(invoiceId, invoiceImported, items);
    }

    @Override
    public PharmacyImportConfirmResult confirm(UUID receiptId, PharmacyImportConfirmRequest request) {
        StockReceipt receipt = requireDraft(receiptId);
        Integer companyId = tenant.requireCompanyId();
        String invoiceId = PharmacyImportMatchSupport.normalizeInvoiceId(request.uzInvoiceDocumentId());
        String ownInvoice = PharmacyImportMatchSupport.normalizeInvoiceId(receipt.getInvoiceNumber());
        if (matchSupport.isInvoiceImported(companyId, invoiceId) && !invoiceId.equals(ownInvoice)) {
            throw PharmacyErrors.of(
                PharmacyReceiptErrors.PHARM_IMPORT_INVOICE_DUPLICATE,
                PharmacyImportMatchSupport.duplicateMessage(invoiceId)
            );
        }
        if (!StringUtils.hasText(receipt.getInvoiceNumber()) && StringUtils.hasText(invoiceId)) {
            receipt.setInvoiceNumber(invoiceId);
            stockReceiptRepository.save(receipt);
        }
        Integer storeId = receipt.getStoreId();
        BigDecimal defaultMarkup = receipt.getDefaultMarkupPercent() != null
            ? receipt.getDefaultMarkupPercent()
            : new BigDecimal("20");
        List<PharmacyImportConfirmItem> accepted = new ArrayList<>();
        for (PharmacyImportConfirmItem item : request.items()) {
            if (item.quantity() != null && item.quantity().compareTo(BigDecimal.ZERO) > 0) {
                accepted.add(item);
            }
        }
        if (accepted.isEmpty()) {
            throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_IMPORT_NO_QTY_LINES);
        }
        List<UUID> productIds = productWriter.write(accepted, storeId, invoiceId, companyId);
        List<PharmacyStockReceiptLineRequest> lines = new ArrayList<>();
        for (int i = 0; i < accepted.size(); i++) {
            lines.add(toLine(accepted.get(i), productIds.get(i), defaultMarkup));
        }
        pharmacyStockReceiptService.addLines(receiptId, lines);
        return new PharmacyImportConfirmResult(lines.size());
    }

    private PharmacyImportMatchItem mapRow(
        int rowIndex,
        List<String> row,
        Map<String, Integer> roles,
        BigDecimal defaultMarkup,
        boolean useFinalSums,
        boolean invoiceImported,
        String invoiceId
    ) {
        String name = PharmacyImportRoleCells.text(row, roles, PharmacyImportRoles.NAME);
        if (!StringUtils.hasText(name) || looksLikeTotal(name)) {
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
        return new PharmacyImportMatchItem(
            rowIndex,
            name,
            blankToNull(manufacturer),
            blankToNull(country),
            invoiceImported ? STATUS_DUPLICATE : STATUS_NEW,
            invoiceImported ? PharmacyImportMatchSupport.duplicateMessage(invoiceId) : null,
            null,
            null,
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
            hints.prescriptionRequired(),
            hints.packageCode(),
            hints.ikpuStatus()
        );
    }

    private PharmacyStockReceiptLineRequest toLine(
        PharmacyImportConfirmItem item,
        UUID productId,
        BigDecimal defaultMarkup
    ) {
        BigDecimal qty = item.quantity() != null ? item.quantity() : BigDecimal.ONE;
        BigDecimal purchase = item.purchasePrice() != null ? item.purchasePrice() : BigDecimal.ZERO;
        BigDecimal vat = PharmacyImportPercent.vatRate(item.vatPercent());
        BigDecimal retail = item.retailPrice() != null
            ? item.retailPrice()
            : PharmacyReceiptPricing.withVat(purchase, vat).multiply(
                BigDecimal.ONE.add(defaultMarkup.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP))
            ).setScale(2, RoundingMode.HALF_UP);
        BigDecimal markup = PharmacyReceiptPricing.markupFrom(PharmacyReceiptPricing.withVat(purchase, vat), retail);
        return new PharmacyStockReceiptLineRequest(
            productId,
            qty,
            purchase,
            retail,
            vat,
            markup,
            item.unitsInPack(),
            PharmacyReceiptPricing.withVat(purchase, vat),
            retail,
            retail,
            item.batchNumber(),
            item.expiryDate()
        );
    }

    private StockReceipt requireDraft(UUID receiptId) {
        StockReceipt receipt = stockReceiptRepository.findDetailedById(receiptId)
            .orElseThrow(() -> PharmacyErrors.notFound(PharmacyReceiptErrors.PHARM_RECEIPT_NOT_FOUND));
        if (!receipt.getCompanyId().equals(tenant.requireCompanyId())) {
            throw PharmacyErrors.of(PharmacyCommonErrors.PHARM_ACCESS_DENIED);
        }
        pharmacyReceipt.requireDraft(receipt);
        return receipt;
    }

    private static boolean looksLikeTotal(String name) {
        return DidoxInvoiceFooterFilter.isFooterText(name);
    }

    private static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}

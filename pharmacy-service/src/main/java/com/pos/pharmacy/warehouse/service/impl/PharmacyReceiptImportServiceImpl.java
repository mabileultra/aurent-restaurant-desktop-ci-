package com.pos.pharmacy.warehouse.service.impl;

import com.pos.pharmacy.common.TenantSupport;
import com.pos.pharmacy.exception.PharmacyErrors;
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
import lombok.RequiredArgsConstructor;
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
import java.util.Locale;
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
    private final Executor importExecutor;

    public PharmacyReceiptImportServiceImpl(
        StockReceiptRepository stockReceiptRepository,
        TenantSupport tenant,
        PharmacyReceiptSupport pharmacyReceipt,
        PharmacyImportGridSupport gridSupport,
        PharmacyImportMatchSupport matchSupport,
        PharmacyStockReceiptService pharmacyStockReceiptService,
        PharmacyImportProductWriter productWriter,
        @Qualifier(PharmacyExecutorNames.IMPORT) Executor importExecutor
    ) {
        this.stockReceiptRepository = stockReceiptRepository;
        this.tenant = tenant;
        this.pharmacyReceipt = pharmacyReceipt;
        this.gridSupport = gridSupport;
        this.matchSupport = matchSupport;
        this.pharmacyStockReceiptService = pharmacyStockReceiptService;
        this.productWriter = productWriter;
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
        return new PharmacyImportParseResponse(
            file.getOriginalFilename(),
            headerRow,
            invoiceId,
            matchSupport.isInvoiceImported(companyId, invoiceId),
            gridSupport.columns(grid.get(headerRow)),
            gridSupport.dataRows(grid, headerRow)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PharmacyImportMatchResponse match(UUID receiptId, PharmacyImportMatchRequest request) {
        StockReceipt receipt = requireDraft(receiptId);
        Integer companyId = tenant.requireCompanyId();
        String invoiceId = PharmacyImportMatchSupport.normalizeInvoiceId(request.uzInvoiceDocumentId());
        boolean invoiceImported = matchSupport.isInvoiceImported(companyId, invoiceId);
        Map<String, Integer> roles = request.roles();
        BigDecimal defaultMarkup = receipt.getDefaultMarkupPercent() != null
            ? receipt.getDefaultMarkupPercent()
            : new BigDecimal("20");
        List<List<String>> rows = request.rows() != null ? request.rows() : List.of();
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
            throw PharmacyErrors.badRequest(PharmacyImportMatchSupport.duplicateMessage(invoiceId));
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
            throw PharmacyErrors.badRequest(
                "Нет строк с количеством. Назначьте колонку «Количество» и цену продажи, затем повторите импорт."
            );
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
        String name = PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.NAME));
        if (!StringUtils.hasText(name) || looksLikeTotal(name)) {
            return null;
        }
        String manufacturer = PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.MANUFACTURER));
        String country = PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.COUNTRY));
        String barcode = PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.BARCODE));
        String ikpu = PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.IKPU));
        String batch = PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.BATCH));
        LocalDate expiry = PharmacyImportValueParser.date(
            PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.EXPIRY))
        );
        BigDecimal qty = PharmacyImportValueParser.decimal(
            PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.QTY))
        );
        BigDecimal vat = PharmacyImportValueParser.decimal(
            PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.VAT_RATE))
        );
        if (vat == null) {
            vat = BigDecimal.ZERO;
        }
        BigDecimal purchase = PharmacyImportValueParser.decimal(
            PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.PURCHASE))
        );
        BigDecimal purchaseWithVat = PharmacyImportValueParser.decimal(
            PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.PURCHASE_WITH_VAT))
        );
        if (purchase == null && purchaseWithVat != null) {
            purchase = withoutVat(purchaseWithVat, vat);
        }
        if (purchase == null) {
            purchase = BigDecimal.ZERO;
        }
        BigDecimal retail = PharmacyImportValueParser.decimal(
            PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.RETAIL))
        );
        if (retail == null) {
            BigDecimal base = purchaseWithVat != null ? purchaseWithVat : withVat(purchase, vat);
            retail = base.multiply(BigDecimal.ONE.add(defaultMarkup.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)))
                .setScale(2, RoundingMode.HALF_UP);
        }
        if (useFinalSums && qty != null && qty.compareTo(BigDecimal.ZERO) > 0) {
            purchase = purchase.divide(qty, 2, RoundingMode.HALF_UP);
            retail = retail.divide(qty, 2, RoundingMode.HALF_UP);
        }
        BigDecimal units = PharmacyImportValueParser.decimal(
            PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.UNITS_IN_PACK))
        );
        List<String> markCodes = PharmacyImportMarkCodesParser.parse(
            PharmacyImportValueParser.cell(row, roles.get(PharmacyImportRoles.MARK_CODES))
        );
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
            markCodes
        );
    }

    private PharmacyStockReceiptLineRequest toLine(
        PharmacyImportConfirmItem item,
        UUID productId,
        BigDecimal defaultMarkup
    ) {
        BigDecimal qty = item.quantity() != null ? item.quantity() : BigDecimal.ONE;
        BigDecimal purchase = item.purchasePrice() != null ? item.purchasePrice() : BigDecimal.ZERO;
        BigDecimal vat = item.vatPercent() != null ? item.vatPercent() : BigDecimal.ZERO;
        BigDecimal retail = item.retailPrice() != null
            ? item.retailPrice()
            : withVat(purchase, vat).multiply(
                BigDecimal.ONE.add(defaultMarkup.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP))
            ).setScale(2, RoundingMode.HALF_UP);
        BigDecimal markup = markupFrom(withVat(purchase, vat), retail);
        return new PharmacyStockReceiptLineRequest(
            productId,
            qty,
            purchase,
            retail,
            vat,
            markup,
            item.unitsInPack(),
            withVat(purchase, vat),
            retail,
            retail,
            item.batchNumber(),
            item.expiryDate()
        );
    }

    private StockReceipt requireDraft(UUID receiptId) {
        StockReceipt receipt = stockReceiptRepository.findDetailedById(receiptId)
            .orElseThrow(() -> PharmacyErrors.notFound("Receipt"));
        if (!receipt.getCompanyId().equals(tenant.requireCompanyId())) {
            throw PharmacyErrors.badRequest("Access denied");
        }
        pharmacyReceipt.requireDraft(receipt);
        return receipt;
    }

    private static boolean looksLikeTotal(String name) {
        String n = name.toLowerCase(Locale.ROOT);
        return n.contains("жами") || n.contains("jami") || n.contains("итого") || n.contains("total");
    }

    private static BigDecimal withVat(BigDecimal purchase, BigDecimal vat) {
        if (purchase == null) {
            return BigDecimal.ZERO;
        }
        if (vat == null || vat.compareTo(BigDecimal.ZERO) == 0) {
            return purchase.setScale(2, RoundingMode.HALF_UP);
        }
        return purchase.multiply(BigDecimal.ONE.add(vat.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)))
            .setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal withoutVat(BigDecimal withVat, BigDecimal vat) {
        if (withVat == null) {
            return BigDecimal.ZERO;
        }
        if (vat == null || vat.compareTo(BigDecimal.ZERO) == 0) {
            return withVat.setScale(2, RoundingMode.HALF_UP);
        }
        return withVat.divide(
            BigDecimal.ONE.add(vat.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)),
            2,
            RoundingMode.HALF_UP
        );
    }

    private static BigDecimal markupFrom(BigDecimal base, BigDecimal retail) {
        if (base == null || base.compareTo(BigDecimal.ZERO) <= 0 || retail == null) {
            return BigDecimal.ZERO;
        }
        return retail.subtract(base).multiply(BigDecimal.valueOf(100)).divide(base, 2, RoundingMode.HALF_UP);
    }

    private static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}

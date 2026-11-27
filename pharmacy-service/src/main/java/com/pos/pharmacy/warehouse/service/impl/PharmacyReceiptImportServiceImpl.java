package com.pos.pharmacy.warehouse.service.impl;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.common.TenantSupport;
import com.pos.pharmacy.config.PharmacyExecutorNames;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyCommonErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyReceiptErrors;
import com.pos.pharmacy.support.PharmacyDbFieldLimits;
import com.pos.pharmacy.support.PharmacyParallelTasks;
import com.pos.pharmacy.util.ProductImportParseUtil;
import com.pos.pharmacy.warehouse.dto.PharmacyStockReceiptLineRequest;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportConfirmItem;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportConfirmRequest;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportConfirmResult;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportMatchItem;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportMatchRequest;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportMatchResponse;
import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportParseResponse;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.repository.StockReceiptRepository;
import com.pos.pharmacy.warehouse.service.PharmacyReceiptImportService;
import com.pos.pharmacy.warehouse.service.PharmacyStockReceiptService;
import com.pos.pharmacy.warehouse.support.PharmacyImportDataRows;
import com.pos.pharmacy.warehouse.support.PharmacyImportGridSupport;
import com.pos.pharmacy.warehouse.support.PharmacyImportMatchSupport;
import com.pos.pharmacy.warehouse.support.PharmacyImportPercent;
import com.pos.pharmacy.warehouse.support.PharmacyImportProductWriter;
import com.pos.pharmacy.warehouse.support.PharmacyImportRoleMap;
import com.pos.pharmacy.warehouse.support.PharmacyImportRowMapper;
import com.pos.pharmacy.warehouse.support.PharmacyReceiptPricing;
import com.pos.pharmacy.warehouse.support.PharmacyReceiptSupport;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Executor;
import java.util.function.Supplier;

@Service
@Transactional
public class PharmacyReceiptImportServiceImpl implements PharmacyReceiptImportService {

    private final StockReceiptRepository stockReceiptRepository;
    private final TenantSupport tenant;
    private final PharmacyReceiptSupport pharmacyReceipt;
    private final PharmacyImportGridSupport gridSupport;
    private final PharmacyImportMatchSupport matchSupport;
    private final PharmacyStockReceiptService pharmacyStockReceiptService;
    private final PharmacyImportProductWriter productWriter;
    private final PharmacyImportRowMapper rowMapper;
    private final Executor importExecutor;

    public PharmacyReceiptImportServiceImpl(
        StockReceiptRepository stockReceiptRepository,
        TenantSupport tenant,
        PharmacyReceiptSupport pharmacyReceipt,
        PharmacyImportGridSupport gridSupport,
        PharmacyImportMatchSupport matchSupport,
        PharmacyStockReceiptService pharmacyStockReceiptService,
        PharmacyImportProductWriter productWriter,
        PharmacyImportRowMapper rowMapper,
        @Qualifier(PharmacyExecutorNames.IMPORT) Executor importExecutor
    ) {
        this.stockReceiptRepository = stockReceiptRepository;
        this.tenant = tenant;
        this.pharmacyReceipt = pharmacyReceipt;
        this.gridSupport = gridSupport;
        this.matchSupport = matchSupport;
        this.pharmacyStockReceiptService = pharmacyStockReceiptService;
        this.productWriter = productWriter;
        this.rowMapper = rowMapper;
        this.importExecutor = importExecutor;
    }

    @Override
    @Transactional(readOnly = true)
    public PharmacyImportParseResponse parse(UUID receiptId, MultipartFile file) {
        StockReceipt receipt = requireDraft(receiptId);
        Integer companyId = tenant.requireCompanyId();
        List<List<String>> grid = gridSupport.readGrid(file);
        int headerRow = gridSupport.findHeaderRow(grid);
        String invoiceId = PharmacyImportMatchSupport.normalizeInvoiceId(gridSupport.extractInvoiceId(grid));
        PharmacyImportDataRows data = gridSupport.extractDataRows(grid, headerRow);
        return new PharmacyImportParseResponse(
            file.getOriginalFilename(),
            headerRow,
            invoiceId,
            matchSupport.isImportedOnAnotherReceipt(companyId, receipt, invoiceId),
            gridSupport.columns(grid.get(headerRow), data.rows()),
            data.rows(),
            data.skipped()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PharmacyImportMatchResponse match(UUID receiptId, PharmacyImportMatchRequest request) {
        StockReceipt receipt = requireDraft(receiptId);
        Integer companyId = tenant.requireCompanyId();
        String invoiceId = PharmacyImportMatchSupport.normalizeInvoiceId(request.uzInvoiceDocumentId());
        boolean blocked = matchSupport.isImportedOnAnotherReceipt(companyId, receipt, invoiceId);
        List<List<String>> rows = request.rows() != null ? request.rows() : List.of();
        int rowOffset = request.rowOffset() != null ? Math.max(0, request.rowOffset()) : 0;
        int skuHorizon = request.totalRows() != null && request.totalRows() > 0
            ? request.totalRows()
            : rowOffset + rows.size();
        Map<String, Product> savedProducts = matchSupport.savedInvoiceProducts(companyId, invoiceId, skuHorizon);
        Set<UUID> onDraft = matchSupport.productIdsOnReceipt(receipt);
        Map<String, Integer> roles = PharmacyImportRoleMap.normalize(
            request.roles(),
            PharmacyImportRoleMap.rowWidth(rows)
        );
        BigDecimal defaultMarkup = receipt.getDefaultMarkupPercent() != null
            ? receipt.getDefaultMarkupPercent()
            : new BigDecimal("20");
        List<Supplier<PharmacyImportMatchItem>> tasks = new ArrayList<>(rows.size());
        for (int i = 0; i < rows.size(); i++) {
            final int rowIndex = rowOffset + i;
            final List<String> row = rows.get(i);
            final String sku = ProductImportParseUtil.resolveUzInvoiceSku(invoiceId, rowIndex + 1);
            final Product bySku = sku == null ? null : savedProducts.get(sku.toUpperCase(Locale.ROOT));
            tasks.add(() -> rowMapper.map(
                rowIndex,
                row,
                roles,
                defaultMarkup,
                request.useFinalSums(),
                invoiceId,
                companyId,
                bySku,
                onDraft
            ));
        }
        List<PharmacyImportMatchItem> items = PharmacyParallelTasks.supplyAll(tasks, importExecutor).stream()
            .filter(item -> item != null)
            .sorted(Comparator.comparingInt(PharmacyImportMatchItem::rowIndex))
            .toList();
        return new PharmacyImportMatchResponse(invoiceId, blocked, items);
    }

    @Override
    public PharmacyImportConfirmResult confirm(UUID receiptId, PharmacyImportConfirmRequest request) {
        StockReceipt receipt = requireDraft(receiptId);
        Integer companyId = tenant.requireCompanyId();
        String invoiceId = PharmacyImportMatchSupport.normalizeInvoiceId(request.uzInvoiceDocumentId());
        if (!StringUtils.hasText(receipt.getInvoiceNumber()) && StringUtils.hasText(invoiceId)) {
            receipt.setInvoiceNumber(PharmacyDbFieldLimits.invoiceNumber(invoiceId));
            stockReceiptRepository.save(receipt);
        }
        Integer storeId = receipt.getStoreId();
        BigDecimal defaultMarkup = receipt.getDefaultMarkupPercent() != null
            ? receipt.getDefaultMarkupPercent()
            : new BigDecimal("20");
        Set<UUID> alreadyOnDraft = matchSupport.productIdsOnReceipt(receipt);
        List<PharmacyImportConfirmItem> accepted = new ArrayList<>();
        for (PharmacyImportConfirmItem item : request.items()) {
            if (item.quantity() == null || item.quantity().compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            if (item.productId() != null && alreadyOnDraft.contains(item.productId())) {
                continue;
            }
            accepted.add(item);
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

}

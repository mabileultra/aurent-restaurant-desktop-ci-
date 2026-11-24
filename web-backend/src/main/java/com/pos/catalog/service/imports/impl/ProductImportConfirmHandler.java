package com.pos.catalog.service.imports.impl;

import com.pos.catalog.dto.product.ProductImportConfirmRequest;
import com.pos.catalog.dto.product.ProductImportPreviewResponse;
import com.pos.catalog.dto.product.ProductImportPreviewRow;
import com.pos.catalog.dto.product.ProductImportResponse;
import com.pos.catalog.service.imports.ProductImportParseOptions;
import com.pos.catalog.service.imports.ProductImportSupport;
import com.pos.catalog.service.imports.support.ProductImportCatalogRefs;
import com.pos.catalog.service.imports.support.ProductImportDuplicateLinker;
import com.pos.catalog.service.imports.support.ProductImportProductCreator;
import com.pos.catalog.service.imports.support.ProductImportQuantity;
import com.pos.catalog.service.imports.support.ProductImportReceiptSupport;
import com.pos.catalog.service.imports.support.ProductImportStrategy;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.inventory.dto.warehouse.StockReceiptLineRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Confirm импорта: создание карточек, привязка дубликатов к кассе, опционально приход. */
@Service
@RequiredArgsConstructor
public class ProductImportConfirmHandler {

    private final ProductImportPreviewHandler previewHandler;
    private final ProductImportCatalogRefs catalogRefs;
    private final ProductImportProductCreator productCreator;
    private final ProductImportReceiptSupport receiptSupport;
    private final ProductImportDuplicateLinker duplicateLinker;

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public ProductImportResponse importFile(MultipartFile file, ProductImportConfirmRequest options) {
        ProductImportConfirmRequest opts = options != null ? options : defaultOptions();
        String source = opts.source() != null ? opts.source() : "CATALOG";
        ProductImportParseOptions parseOpts = ProductImportParseOptions.fromConfirm(opts);
        ProductImportPreviewResponse preview = previewHandler.preview(file, source, parseOpts);
        ProductImportStrategy strategy = ProductImportStrategy.from(opts.strategy());

        Map<Integer, ProductImportConfirmRequest.ImportRowConfirm> overrides = buildOverrideMap(opts);
        Integer defaultCategoryId = catalogRefs.resolveCategoryId(
            opts.defaultCategoryId(),
            "Общая категория для импорта"
        );
        Integer defaultStoreId = catalogRefs.resolveStoreId(
            opts.defaultStoreId(),
            "Общий магазин для импорта"
        );
        if (strategy.requiresDefaultStore() && defaultStoreId == null) {
            throw new BadRequestException(strategy.asReceipt()
                ? "Выберите магазин для прихода"
                : "Выберите магазин для импорта в выбранный магазин(ы)");
        }

        List<String> errors = new ArrayList<>();
        int created = 0;
        int skipped = 0;
        int linked = 0;
        Set<String> seenRowKeys = new HashSet<>();
        List<StockReceiptLineRequest> receiptLines = new ArrayList<>();

        for (ProductImportPreviewRow row : preview.rows()) {
            if (ProductImportPreviewRow.STATUS_INVALID.equals(row.status())) {
                errors.add("Строка " + row.rowNum() + ": " + row.message());
                skipped++;
                continue;
            }

            String rowKey = ProductImportSupport.rowDedupeKey(row);
            if (!seenRowKeys.add(rowKey)) {
                errors.add("Строка " + row.rowNum() + ": дубликат позиции в файле");
                skipped++;
                continue;
            }

            ProductImportConfirmRequest.ImportRowConfirm rowOpts = overrides.get(row.rowNum());
            try {
                if (ProductImportPreviewRow.STATUS_DUPLICATE.equals(row.status())) {
                    int n = handleDuplicate(row, rowOpts, defaultStoreId, strategy, receiptLines);
                    if (n > 0) {
                        linked += n;
                    } else {
                        skipped++;
                    }
                    continue;
                }
                if (!ProductImportPreviewRow.STATUS_NEW.equals(row.status())) {
                    skipped++;
                    continue;
                }

                UUID productId = productCreator.create(
                    row,
                    rowOpts,
                    defaultCategoryId,
                    defaultStoreId,
                    opts.defaultStorageLocation(),
                    strategy.zeroInitialStock()
                );
                created++;
                if (strategy.catalogOnly()) {
                    duplicateLinker.ensurePresenceAfterCreate(productId, defaultStoreId);
                }
                if (strategy.asReceipt() && productId != null) {
                    BigDecimal qty = ProductImportQuantity.resolve(row, rowOpts);
                    if (qty.signum() > 0) {
                        receiptLines.add(receiptSupport.toLine(productId, row, rowOpts));
                    }
                }
            } catch (BadRequestException | ResourceNotFoundException ex) {
                errors.add("Строка " + row.rowNum() + ": " + ex.getMessage());
                skipped++;
            } catch (DataIntegrityViolationException ex) {
                errors.add("Строка " + row.rowNum() + ": " + ex.getMostSpecificCause().getMessage());
                skipped++;
            }
        }

        String receiptNumber = null;
        if (strategy.asReceipt()) {
            String contract = StringUtils.hasText(opts.contractNumber())
                ? opts.contractNumber().trim()
                : preview.contractNumber();
            receiptNumber = receiptSupport.postReceipt(
                defaultStoreId,
                opts.supplierId(),
                opts.paymentType(),
                opts.receiptNotes(),
                preview.uzInvoiceDocumentId(),
                contract,
                receiptLines,
                created + linked,
                errors
            );
        }

        return new ProductImportResponse(created, skipped, errors, receiptNumber, linked);
    }

    /**
     * @return 1 если строка обработана (привязка / приход), иначе 0 → caller считает skipped
     */
    private int handleDuplicate(
        ProductImportPreviewRow row,
        ProductImportConfirmRequest.ImportRowConfirm rowOpts,
        Integer defaultStoreId,
        ProductImportStrategy strategy,
        List<StockReceiptLineRequest> receiptLines
    ) {
        if (row.existingProductId() == null) {
            return 0;
        }
        if (strategy.asReceipt()) {
            BigDecimal qty = ProductImportQuantity.resolve(row, rowOpts);
            if (qty.signum() <= 0) {
                return 0;
            }
            receiptLines.add(receiptSupport.toLine(row.existingProductId(), row, rowOpts));
            duplicateLinker.linkToAssortment(row, rowOpts, defaultStoreId);
            return 1;
        }
        if (strategy.catalogOnly()) {
            UUID id = duplicateLinker.linkToAssortment(row, rowOpts, defaultStoreId);
            return id != null ? 1 : 0;
        }
        return 0;
    }

    private static ProductImportConfirmRequest defaultOptions() {
        return new ProductImportConfirmRequest(
            "AS_FILE", "CATALOG", true, null, null, null, null, "CASH", null, null, null, List.of()
        );
    }

    private static Map<Integer, ProductImportConfirmRequest.ImportRowConfirm> buildOverrideMap(
        ProductImportConfirmRequest opts
    ) {
        Map<Integer, ProductImportConfirmRequest.ImportRowConfirm> map = new HashMap<>();
        if (opts.rows() == null) {
            return map;
        }
        for (ProductImportConfirmRequest.ImportRowConfirm row : opts.rows()) {
            map.put(row.rowNum(), row);
        }
        return map;
    }
}

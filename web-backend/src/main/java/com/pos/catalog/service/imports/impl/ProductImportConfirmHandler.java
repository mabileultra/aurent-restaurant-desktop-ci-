package com.pos.catalog.service.imports.impl;

import com.pos.catalog.dto.product.ProductImportConfirmRequest;
import com.pos.catalog.dto.product.ProductImportPreviewResponse;
import com.pos.catalog.dto.product.ProductImportPreviewRow;
import com.pos.catalog.dto.product.ProductImportResponse;
import com.pos.catalog.service.imports.ProductImportParseOptions;
import com.pos.catalog.service.imports.ProductImportSupport;
import com.pos.catalog.service.imports.support.ProductImportCatalogRefs;
import com.pos.catalog.service.imports.support.ProductImportProductCreator;
import com.pos.catalog.service.imports.support.ProductImportReceiptSupport;
import com.pos.catalog.service.imports.support.ProductImportStrategy;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.inventory.dto.warehouse.StockReceiptLineRequest;
import com.pos.util.QuantityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Confirm импорта: создание карточек (+ опционально приход). */
@Service
@RequiredArgsConstructor
public class ProductImportConfirmHandler {

    private final ProductImportPreviewHandler previewHandler;
    private final ProductImportCatalogRefs catalogRefs;
    private final ProductImportProductCreator productCreator;
    private final ProductImportReceiptSupport receiptSupport;

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
        Set<String> seenRowKeys = new HashSet<>();
        List<StockReceiptLineRequest> receiptLines = new ArrayList<>();

        for (ProductImportPreviewRow row : preview.rows()) {
            if (ProductImportPreviewRow.STATUS_INVALID.equals(row.status())) {
                errors.add("Строка " + row.rowNum() + ": " + row.message());
                skipped++;
                continue;
            }
            if (!ProductImportPreviewRow.STATUS_NEW.equals(row.status())) {
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
                UUID productId = productCreator.create(
                    row,
                    rowOpts,
                    defaultCategoryId,
                    defaultStoreId,
                    opts.defaultStorageLocation(),
                    strategy.zeroInitialStock()
                );
                created++;
                if (strategy.asReceipt() && productId != null) {
                    BigDecimal qty = QuantityUtil.normalize(row.quantity());
                    if (qty != null && qty.signum() < 0) {
                        throw new BadRequestException("Количество не может быть отрицательным");
                    }
                    if (qty != null && qty.signum() > 0) {
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
            receiptNumber = receiptSupport.postReceipt(
                defaultStoreId,
                preview.uzInvoiceDocumentId(),
                receiptLines,
                created,
                errors
            );
        }

        return new ProductImportResponse(created, skipped, errors, receiptNumber);
    }

    private static ProductImportConfirmRequest defaultOptions() {
        return new ProductImportConfirmRequest("AS_FILE", "CATALOG", true, null, null, null, List.of());
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

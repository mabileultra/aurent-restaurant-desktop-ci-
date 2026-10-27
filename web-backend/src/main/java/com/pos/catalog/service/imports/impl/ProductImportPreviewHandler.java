package com.pos.catalog.service.imports.impl;

import com.pos.catalog.dto.product.ProductImportPreviewResponse;
import com.pos.catalog.dto.product.ProductImportPreviewRow;
import com.pos.catalog.service.imports.ProductImportParseOptions;
import com.pos.catalog.service.imports.ProductImportSource;
import com.pos.catalog.service.imports.source.ProductImportSourceHandler;
import com.pos.catalog.service.imports.source.ProductImportSourceHandlers;
import com.pos.catalog.service.imports.support.ProductImportFileParser;
import com.pos.util.ProductImportParseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Preview импорта: разбор файла → строки с статусами NEW/DUPLICATE/INVALID. */
@Service
@RequiredArgsConstructor
public class ProductImportPreviewHandler {

    private final ProductImportSourceHandlers sourceHandlers;
    private final ProductImportFileParser fileParser;

    @Transactional(readOnly = true)
    public ProductImportPreviewResponse preview(
        MultipartFile file,
        String source,
        ProductImportParseOptions options
    ) {
        ProductImportSource importSource = ProductImportSource.fromParam(source);
        ProductImportSourceHandler handler = sourceHandlers.require(importSource);
        ProductImportParseOptions parseOpts =
            options != null ? options : ProductImportParseOptions.defaults();
        List<Map<String, String>> rows = fileParser.parse(file, handler);
        List<ProductImportPreviewRow> preview = new ArrayList<>();
        int rowNum = 2;
        for (Map<String, String> row : rows) {
            if (ProductImportParseUtil.isRowEmpty(row)) {
                continue;
            }
            preview.add(handler.toPreviewRow(rowNum++, row, parseOpts));
        }
        int dup = (int) preview.stream()
            .filter(r -> ProductImportPreviewRow.STATUS_DUPLICATE.equals(r.status()))
            .count();
        int invalid = (int) preview.stream()
            .filter(r -> ProductImportPreviewRow.STATUS_INVALID.equals(r.status()))
            .count();
        int newRows = (int) preview.stream()
            .filter(r -> ProductImportPreviewRow.STATUS_NEW.equals(r.status()))
            .count();
        String fileInvoiceId = handler.resolveFileInvoiceId(rows);
        boolean invoiceAlreadyImported = handler.isFileAlreadyImported(fileInvoiceId);
        return new ProductImportPreviewResponse(
            importSource.name(),
            fileInvoiceId,
            invoiceAlreadyImported,
            preview.size(),
            newRows,
            dup,
            invalid,
            preview
        );
    }
}

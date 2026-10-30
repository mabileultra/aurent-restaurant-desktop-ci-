package com.pos.catalog.service.imports.impl;

import com.pos.catalog.dto.product.ProductImportConfirmRequest;
import com.pos.catalog.dto.product.ProductImportPreviewResponse;
import com.pos.catalog.dto.product.ProductImportResponse;
import com.pos.catalog.service.imports.ProductImportParseOptions;
import com.pos.catalog.service.imports.ProductImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Facade импорта товаров. Preview / confirm / parse / create / receipt — в handlers и support.
 */
@Service
@RequiredArgsConstructor
public class ProductImportServiceImpl implements ProductImportService {

    private final ProductImportPreviewHandler previewHandler;
    private final ProductImportConfirmHandler confirmHandler;

    @Override
    public ProductImportPreviewResponse preview(
        MultipartFile file,
        String source,
        ProductImportParseOptions options
    ) {
        return previewHandler.preview(file, source, options);
    }

    @Override
    public ProductImportResponse importFile(MultipartFile file, ProductImportConfirmRequest options) {
        return confirmHandler.importFile(file, options);
    }
}

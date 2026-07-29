package com.pos.catalog.service.imports;

import com.pos.catalog.dto.product.ProductImportConfirmRequest;
import com.pos.catalog.dto.product.ProductImportPreviewResponse;
import com.pos.catalog.dto.product.ProductImportResponse;
import org.springframework.web.multipart.MultipartFile;

public interface ProductImportService {

    ProductImportPreviewResponse preview(
        MultipartFile file,
        String source,
        ProductImportParseOptions options
    );

    ProductImportResponse importFile(MultipartFile file, ProductImportConfirmRequest options);
}

package com.pos.catalog.service.export;

import com.pos.catalog.dto.product.ProductExportPreviewRow;
import com.pos.catalog.dto.product.ProductExportRequest;

import java.math.BigDecimal;
import java.util.List;

public interface ProductExportService {

    List<ProductExportPreviewRow> previewExport(String storeIdsParam, BigDecimal markupPercent);

    byte[] exportCatalogExcel(ProductExportRequest request);

    byte[] buildImportTemplateExcel();
}

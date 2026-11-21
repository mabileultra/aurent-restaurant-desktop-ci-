package com.pos.catalog.service.imports.support;

import com.pos.catalog.dto.product.ProductImportHeadersResponse;
import com.pos.catalog.service.imports.ProductImportSource;
import com.pos.exception.BadRequestException;
import com.pos.spreadsheet.ExcelCatalogColumnAliases;
import com.pos.spreadsheet.ExcelColumn;
import com.pos.spreadsheet.ExcelFlexibleCatalogReader;
import com.pos.spreadsheet.ExcelTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

/** Чтение заголовков Excel для UI маппинга колонок (CATALOG). */
@Component
@RequiredArgsConstructor
public class ProductImportHeadersInspector {

    private final ExcelFlexibleCatalogReader flexibleCatalogReader;

    public ProductImportHeadersResponse inspect(MultipartFile file, String sourceParam) {
        ProductImportSource source = ProductImportSource.fromParam(sourceParam);
        if (source != ProductImportSource.CATALOG) {
            throw new BadRequestException(
                "Сопоставление колонок доступно только для импорта каталога (CATALOG)"
            );
        }
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Файл не выбран");
        }
        String lower = Objects.requireNonNullElse(file.getOriginalFilename(), "").toLowerCase(Locale.ROOT);
        if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
            throw new BadRequestException("Для сопоставления колонок нужен Excel (.xls / .xlsx)");
        }
        try {
            List<String> headers = flexibleCatalogReader.readHeaderLabels(file.getInputStream());
            ExcelTemplate template = ExcelTemplate.PRODUCTS_CATALOG;
            var suggested = ExcelCatalogColumnAliases.suggest(headers, template);
            List<ProductImportHeadersResponse.ProductImportFieldMeta> fields = new ArrayList<>();
            for (ExcelColumn col : template.columns()) {
                fields.add(new ProductImportHeadersResponse.ProductImportFieldMeta(
                    col.key(),
                    col.header(),
                    template.requiredImportKeys().contains(col.key())
                ));
            }
            return new ProductImportHeadersResponse(headers, suggested, fields);
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Не удалось прочитать заголовки: " + e.getMessage());
        }
    }
}

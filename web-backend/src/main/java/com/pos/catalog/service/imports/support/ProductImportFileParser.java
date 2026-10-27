package com.pos.catalog.service.imports.support;

import com.pos.catalog.service.imports.source.ProductImportSourceHandler;
import com.pos.exception.BadRequestException;
import com.pos.spreadsheet.parser.HtmlExcelTableParser;
import com.pos.spreadsheet.parser.UzInvoiceJsonParser;
import com.pos.spreadsheet.parser.UzInvoicePdfParser;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/** Разбор загруженного файла импорта в сырые строки. */
@Component
public class ProductImportFileParser {

    public List<Map<String, String>> parse(MultipartFile file, ProductImportSourceHandler handler) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Файл не выбран");
        }
        String lower = Objects.requireNonNullElse(file.getOriginalFilename(), "").toLowerCase(Locale.ROOT);
        try {
            byte[] bytes = file.getBytes();
            boolean htmlInvoice = HtmlExcelTableParser.isHtmlSpreadsheet(bytes);
            boolean pdf = UzInvoicePdfParser.looksLikePdf(bytes) || lower.endsWith(".pdf");
            boolean json = UzInvoiceJsonParser.looksLikeJson(bytes)
                && !htmlInvoice
                && !pdf
                && (lower.endsWith(".json") || !lower.endsWith(".xls") && !lower.endsWith(".xlsx"));
            boolean excel = !pdf && (lower.endsWith(".xlsx") || lower.endsWith(".xls") || htmlInvoice);
            if (!json && !excel && !pdf) {
                throw new BadRequestException(
                    "Поддерживаются файлы Excel (.xls, .xlsx), PDF счёт-фактура (.pdf), HTML-счёт-фактура (.xls) или JSON (.json)"
                );
            }
            if (json) {
                return handler.parseJson(bytes);
            }
            if (pdf) {
                return handler.parsePdf(bytes);
            }
            try (InputStream in = new ByteArrayInputStream(bytes)) {
                return handler.parseSpreadsheet(in);
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException(
                "Не удалось прочитать файл: " + e.getMessage(),
                Map.of(
                    "source", handler.source().name(),
                    "cause", e.getClass().getSimpleName()
                ),
                e
            );
        }
    }
}

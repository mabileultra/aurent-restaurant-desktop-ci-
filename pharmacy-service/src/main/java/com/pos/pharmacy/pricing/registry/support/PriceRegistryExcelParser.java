package com.pos.pharmacy.pricing.registry.support;

import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyPriceRegistryErrors;
import com.pos.pharmacy.pricing.registry.dto.RegistryParsedRow;
import com.pos.shared.log.LogUtil;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** POI: Pharm ID, barcode, trade name, limit retail price with VAT. */
@Component
public class PriceRegistryExcelParser {

    private final DataFormatter formatter = new DataFormatter(Locale.ROOT);

    public List<RegistryParsedRow> parse(Path xlsx) {
        try (InputStream in = Files.newInputStream(xlsx); Workbook wb = WorkbookFactory.create(in)) {
            Sheet sheet = wb.getNumberOfSheets() > 0 ? wb.getSheetAt(0) : null;
            if (sheet == null) {
                throw PharmacyErrors.of(
                    PharmacyPriceRegistryErrors.PHARM_PRICE_REGISTRY_PARSE_FAILED,
                    "Пустой Excel"
                );
            }
            HeaderMap headers = detectHeaders(sheet);
            if (headers.priceCol < 0) {
                throw PharmacyErrors.of(
                    PharmacyPriceRegistryErrors.PHARM_PRICE_REGISTRY_PARSE_FAILED,
                    "Не найден столбец предельной цены"
                );
            }
            List<RegistryParsedRow> rows = new ArrayList<>();
            int start = headers.headerRow + 1;
            for (int r = start; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) {
                    continue;
                }
                String pharmId = cell(row, headers.pharmIdCol);
                String barcode = normalizeBarcode(cell(row, headers.barcodeCol));
                String name = cell(row, headers.nameCol);
                BigDecimal limit = parseMoney(cell(row, headers.priceCol));
                if (limit == null) {
                    continue;
                }
                if ((barcode == null || barcode.isBlank())
                    && (pharmId == null || pharmId.isBlank())
                    && (name == null || name.isBlank())) {
                    continue;
                }
                rows.add(new RegistryParsedRow(
                    blankToNull(pharmId),
                    blankToNull(barcode),
                    blankToNull(name),
                    limit
                ));
            }
            LogUtil.info(PriceRegistryExcelParser.class, "Parsed {} registry rows", rows.size());
            return rows;
        } catch (com.pos.pharmacy.exception.BusinessException ex) {
            throw ex;
        } catch (Exception e) {
            LogUtil.error(PriceRegistryExcelParser.class, "Excel parse failed: {}", e.toString());
            throw PharmacyErrors.of(
                PharmacyPriceRegistryErrors.PHARM_PRICE_REGISTRY_PARSE_FAILED,
                e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()
            );
        }
    }

    private HeaderMap detectHeaders(Sheet sheet) {
        int maxScan = Math.min(sheet.getLastRowNum(), 25);
        for (int r = 0; r <= maxScan; r++) {
            Row row = sheet.getRow(r);
            if (row == null) {
                continue;
            }
            int pharm = -1;
            int barcode = -1;
            int name = -1;
            int price = -1;
            short last = row.getLastCellNum();
            for (int c = 0; c < last; c++) {
                String h = cell(row, c);
                if (h == null || h.isBlank()) {
                    continue;
                }
                String n = h.toLowerCase(Locale.ROOT)
                    .replace('\u00a0', ' ')
                    .trim();
                if (pharm < 0 && (n.contains("pharm") && n.contains("id")
                    || n.equals("id")
                    || n.contains("код препарат")
                    || n.contains("id препарат"))) {
                    pharm = c;
                } else if (barcode < 0 && (n.contains("штрих")
                    || n.contains("barcode")
                    || n.contains("штрихкод")
                    || n.contains("ean"))) {
                    barcode = c;
                } else if (name < 0 && (n.contains("торгов")
                    || n.contains("наимен")
                    || n.contains("препарат")
                    || n.contains("trade")
                    || n.contains("nom"))) {
                    name = c;
                } else if (price < 0 && (n.contains("предел")
                    || n.contains("рознич")
                    || (n.contains("цена") && n.contains("ндс"))
                    || n.contains("limit")
                    || n.contains("reference")
                    || n.contains("мах") && n.contains("нарх"))) {
                    price = c;
                }
            }
            if (price >= 0) {
                return new HeaderMap(r, pharm, barcode, name, price);
            }
        }
        return new HeaderMap(0, 0, 1, 2, 3);
    }

    private String cell(Row row, int col) {
        if (col < 0 || row == null) {
            return null;
        }
        return formatter.formatCellValue(row.getCell(col)).trim();
    }

    private static String normalizeBarcode(String raw) {
        if (raw == null) {
            return null;
        }
        String digits = raw.replaceAll("[^0-9]", "");
        return digits.isBlank() ? raw.trim() : digits;
    }

    private static BigDecimal parseMoney(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String cleaned = raw.replace('\u00a0', ' ')
            .replace(" ", "")
            .replace(",", ".")
            .replaceAll("[^0-9.]", "");
        if (cleaned.isBlank()) {
            return null;
        }
        try {
            return new BigDecimal(cleaned).setScale(2, RoundingMode.HALF_UP);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record HeaderMap(int headerRow, int pharmIdCol, int barcodeCol, int nameCol, int priceCol) {}
}

package com.pos.spreadsheet;

import com.pos.exception.BadRequestException;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Чтение Excel номенклатуры: любой порядок колонок + ручной маппинг заголовков → наши ключи.
 */
@Component
public class ExcelFlexibleCatalogReader {

    public List<String> readHeaderLabels(InputStream in) throws IOException {
        byte[] bytes = in.readAllBytes();
        try (Workbook wb = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            return headerLabels(wb.getSheetAt(0));
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Не удалось прочитать заголовки Excel: " + e.getMessage());
        }
    }

    public List<Map<String, String>> read(
        InputStream in,
        ExcelTemplate template,
        Map<String, String> columnMapping
    ) throws IOException {
        byte[] bytes = in.readAllBytes();
        DataFormatter formatter = new DataFormatter();
        try (Workbook wb = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            Sheet sheet = wb.getSheetAt(0);
            List<String> headers = headerLabels(sheet);
            Map<String, String> mapping = resolveMapping(headers, template, columnMapping);
            validateRequired(mapping, template);

            Map<String, Integer> keyToCol = new LinkedHashMap<>();
            for (Map.Entry<String, String> e : mapping.entrySet()) {
                int idx = indexOfHeader(headers, e.getValue());
                if (idx < 0) {
                    throw new BadRequestException(
                        "Колонка «" + e.getValue() + "» не найдена в файле (поле " + e.getKey() + ")"
                    );
                }
                keyToCol.put(e.getKey(), idx);
            }

            List<Map<String, String>> rows = new ArrayList<>();
            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row dataRow = sheet.getRow(r);
                Map<String, String> map = new LinkedHashMap<>();
                boolean any = false;
                for (ExcelColumn col : template.columns()) {
                    Integer c = keyToCol.get(col.key());
                    String val = "";
                    if (c != null && dataRow != null) {
                        val = formatter.formatCellValue(dataRow.getCell(c)).trim();
                    }
                    if (StringUtils.hasText(val)) {
                        any = true;
                    }
                    map.put(col.key(), val);
                }
                if (any) {
                    rows.add(map);
                }
            }
            return rows;
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Не удалось прочитать Excel: " + e.getMessage());
        }
    }

    private static List<String> headerLabels(Sheet sheet) {
        DataFormatter formatter = new DataFormatter();
        Row headerRow = sheet.getRow(0);
        if (headerRow == null) {
            throw new BadRequestException("Файл пуст: отсутствует строка заголовков");
        }
        int last = Math.max(headerRow.getLastCellNum(), 0);
        List<String> headers = new ArrayList<>();
        for (int c = 0; c < last; c++) {
            String h = formatter.formatCellValue(headerRow.getCell(c)).trim();
            if (StringUtils.hasText(h) || c < last - 1) {
                headers.add(h);
            }
        }
        while (!headers.isEmpty() && !StringUtils.hasText(headers.get(headers.size() - 1))) {
            headers.remove(headers.size() - 1);
        }
        if (headers.isEmpty()) {
            throw new BadRequestException("Файл пуст: нет заголовков колонок");
        }
        return headers;
    }

    private static Map<String, String> resolveMapping(
        List<String> headers,
        ExcelTemplate template,
        Map<String, String> columnMapping
    ) {
        if (columnMapping != null && !columnMapping.isEmpty()) {
            Map<String, String> cleaned = new LinkedHashMap<>();
            for (Map.Entry<String, String> e : columnMapping.entrySet()) {
                if (!StringUtils.hasText(e.getKey()) || !StringUtils.hasText(e.getValue())) {
                    continue;
                }
                cleaned.put(e.getKey().trim(), e.getValue().trim());
            }
            return cleaned;
        }
        return ExcelCatalogColumnAliases.suggest(headers, template);
    }

    private static void validateRequired(Map<String, String> mapping, ExcelTemplate template) {
        for (String key : template.requiredImportKeys()) {
            if (!StringUtils.hasText(mapping.get(key))) {
                String label = template.columns().stream()
                    .filter(c -> c.key().equals(key))
                    .map(ExcelColumn::header)
                    .findFirst()
                    .orElse(key);
                throw new BadRequestException(
                    "Не сопоставлена обязательная колонка: «" + label + "». "
                        + "Укажите соответствие колонок файла нашим полям."
                );
            }
        }
    }

    private static int indexOfHeader(List<String> headers, String wanted) {
        for (int i = 0; i < headers.size(); i++) {
            if (headers.get(i).equals(wanted)) {
                return i;
            }
        }
        String norm = ExcelSpreadsheetReader.normHeader(wanted);
        for (int i = 0; i < headers.size(); i++) {
            if (ExcelSpreadsheetReader.normHeader(headers.get(i)).equals(norm)) {
                return i;
            }
        }
        return -1;
    }
}

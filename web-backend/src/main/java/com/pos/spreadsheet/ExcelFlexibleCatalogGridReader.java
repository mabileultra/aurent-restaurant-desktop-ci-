package com.pos.spreadsheet;

import com.pos.exception.BadRequestException;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Разбор уже плоской сетки (Excel sheet / HTML table) в заголовки и строки каталога.
 */
final class ExcelFlexibleCatalogGridReader {

    private ExcelFlexibleCatalogGridReader() {
    }

    static List<String> headerLabels(List<List<String>> grid) {
        if (grid == null || grid.isEmpty()) {
            throw new BadRequestException("Файл пуст: отсутствует строка заголовков");
        }
        List<String> headers = new ArrayList<>(grid.get(0));
        while (!headers.isEmpty() && !StringUtils.hasText(headers.get(headers.size() - 1))) {
            headers.remove(headers.size() - 1);
        }
        if (headers.isEmpty()) {
            throw new BadRequestException("Файл пуст: нет заголовков колонок");
        }
        return headers;
    }

    static List<Map<String, String>> readRows(
        List<List<String>> grid,
        ExcelTemplate template,
        Map<String, String> columnMapping
    ) {
        List<String> headers = headerLabels(grid);
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
        for (int r = 1; r < grid.size(); r++) {
            List<String> dataRow = grid.get(r);
            Map<String, String> map = new LinkedHashMap<>();
            boolean any = false;
            for (ExcelColumn col : template.columns()) {
                Integer c = keyToCol.get(col.key());
                String val = "";
                if (c != null && dataRow != null && c < dataRow.size() && dataRow.get(c) != null) {
                    val = dataRow.get(c).trim();
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

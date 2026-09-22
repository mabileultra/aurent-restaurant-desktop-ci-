package com.pos.spreadsheet;

import com.pos.exception.BadRequestException;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class ExcelSpreadsheetReader {

    public List<Map<String, String>> read(InputStream in, ExcelTemplate template) {
        DataFormatter formatter = new DataFormatter();
        byte[] bytes;
        try {
            bytes = in.readAllBytes();
        } catch (IOException e) {
            throw new BadRequestException("Не удалось прочитать Excel: " + e.getMessage());
        }
        if (bytes.length == 0) {
            throw new BadRequestException("Файл пуст");
        }
        String head = new String(bytes, 0, Math.min(bytes.length, 256), java.nio.charset.StandardCharsets.UTF_8)
            .trim()
            .toLowerCase(Locale.ROOT);
        if (head.startsWith("<!doctype") || head.startsWith("<html") || head.contains("<html")) {
            throw new BadRequestException(
                "Файл является HTML, а не Excel. Скачайте шаблон из системы (.xlsx) "
                    + "или сохраните счёт-фактуру как настоящий Excel — не веб-страницу."
            );
        }
        try (Workbook wb = WorkbookFactory.create(new java.io.ByteArrayInputStream(bytes))) {
            Sheet sheet = wb.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new BadRequestException("Файл пуст: отсутствует строка заголовков");
            }

            List<ExcelColumn> expected = template.columns();
            List<String> keys = new ArrayList<>();
            for (int c = 0; c < expected.size(); c++) {
                String header = formatter.formatCellValue(headerRow.getCell(c)).trim();
                String normalized = normHeader(header);
                String expectedKey = expected.get(c).key();
                if (!expectedKey.equals(normalized) && !normHeader(expected.get(c).header()).equals(normalized)) {
                    throw new BadRequestException(
                        "Неверный шаблон. Колонка " + (c + 1) + ": ожидается «"
                            + expected.get(c).header() + "», получено «" + header + "»"
                    );
                }
                keys.add(expectedKey);
            }

            List<Map<String, String>> rows = new ArrayList<>();
            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row dataRow = sheet.getRow(r);
                Map<String, String> map = new LinkedHashMap<>();
                boolean any = false;
                for (int c = 0; c < keys.size(); c++) {
                    String val = dataRow == null ? "" : formatter.formatCellValue(dataRow.getCell(c)).trim();
                    if (StringUtils.hasText(val)) {
                        any = true;
                    }
                    map.put(keys.get(c), val);
                }
                if (any) {
                    rows.add(map);
                }
            }
            return rows;
        } catch (BadRequestException e) {
            throw e;
        } catch (IOException e) {
            throw new BadRequestException("Не удалось прочитать Excel: " + e.getMessage());
        }
    }

    public static String normHeader(String header) {
        if (header == null) {
            return "";
        }
        return header.trim().toLowerCase(Locale.ROOT).replace(' ', '_');
    }
}

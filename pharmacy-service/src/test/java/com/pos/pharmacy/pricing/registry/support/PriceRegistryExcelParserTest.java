package com.pos.pharmacy.pricing.registry.support;

import com.pos.pharmacy.pricing.registry.dto.RegistryParsedRow;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class PriceRegistryExcelParserTest {

    @TempDir
    Path temp;

    @Test
    void parsesPharmIdBarcodeNameAndLimit() throws Exception {
        Path file = temp.resolve("registry.xlsx");
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet();
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Pharm ID");
            header.createCell(1).setCellValue("Штрих-код");
            header.createCell(2).setCellValue("Торговое наименование");
            header.createCell(3).setCellValue("Предельная розничная цена с НДС");
            Row row = sheet.createRow(1);
            row.createCell(0).setCellValue("P-100");
            row.createCell(1).setCellValue("4780012345678");
            row.createCell(2).setCellValue("Аспирин");
            row.createCell(3).setCellValue("12500.50");
            try (var out = Files.newOutputStream(file)) {
                wb.write(out);
            }
        }

        List<RegistryParsedRow> rows = new PriceRegistryExcelParser().parse(file);
        assertFalse(rows.isEmpty());
        RegistryParsedRow first = rows.get(0);
        assertEquals("P-100", first.pharmId());
        assertEquals("4780012345678", first.barcode());
        assertEquals("Аспирин", first.tradeName());
        assertEquals(new BigDecimal("12500.50"), first.limitPriceVat());
    }

    @Test
    void prefersRetailVatColumnAndStripsPharmIdDecimal() throws Exception {
        Path file = temp.resolve("mpa.xlsx");
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet();
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Pharm ID");
            header.createCell(1).setCellValue("Торговая марка");
            header.createCell(2).setCellValue("Предельная цена  (*для отечественных производителей НДС включен в предельную цену)");
            header.createCell(3).setCellValue("Оптовая цена (с НДС)");
            header.createCell(4).setCellValue("Розничная цена UZS (с НДС)");
            Row row = sheet.createRow(1);
            row.createCell(0).setCellValue("1010002.0");
            row.createCell(1).setCellValue("ЗОЛАН");
            row.createCell(2).setCellValue("14 560");
            row.createCell(3).setCellValue("16 744");
            row.createCell(4).setCellValue("23 956.80");
            try (var out = Files.newOutputStream(file)) {
                wb.write(out);
            }
        }

        RegistryParsedRow first = new PriceRegistryExcelParser().parse(file).get(0);
        assertEquals("1010002", first.pharmId());
        assertEquals("ЗОЛАН", first.tradeName());
        assertEquals(new BigDecimal("23956.80"), first.limitPriceVat());
    }
}

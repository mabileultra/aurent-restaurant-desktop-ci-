package com.pos.pharmacy.catalog.registry.support;

import com.pos.pharmacy.catalog.registry.dto.DrugRegistryParsedRow;
import com.pos.pharmacy.warehouse.support.PharmacyMassExecutor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.Executor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DrugRegistryExcelParserTest {

    @Test
    void readsTradeNameCountryAndPrescription() throws Exception {
        Path file = Files.createTempFile("drug-registry-", ".xlsx");
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            var sheet = wb.createSheet("Лекарства");
            var header = sheet.createRow(0);
            header.createCell(0).setCellValue("Торговое название");
            header.createCell(1).setCellValue("Производитель");
            header.createCell(2).setCellValue("Страна");
            header.createCell(3).setCellValue("Условия отпуска");
            header.createCell(4).setCellValue("Номер регистрационного удостоверения");
            var row = sheet.createRow(1);
            row.createCell(0).setCellValue("Парацетамол");
            row.createCell(1).setCellValue("Узхимфарм");
            row.createCell(2).setCellValue("Узбекистан");
            row.createCell(3).setCellValue("рецептсиз");
            row.createCell(4).setCellValue("DV/X 0001");
            try (var out = Files.newOutputStream(file)) {
                wb.write(out);
            }
        }
        PharmacyMassExecutor mass = mock(PharmacyMassExecutor.class);
        Executor sync = Runnable::run;
        when(mass.executor()).thenReturn(sync);
        List<DrugRegistryParsedRow> rows = new DrugRegistryExcelParser(mass).parse(file);
        assertEquals(1, rows.size());
        assertEquals("Парацетамол", rows.get(0).tradeName());
        assertEquals("Узбекистан", rows.get(0).country());
        assertEquals("Узхимфарм", rows.get(0).manufacturer());
        assertEquals(Boolean.FALSE, rows.get(0).prescriptionRequired());
        assertEquals("DV/X 0001", rows.get(0).registrationNumber());
        Files.deleteIfExists(file);
    }
}

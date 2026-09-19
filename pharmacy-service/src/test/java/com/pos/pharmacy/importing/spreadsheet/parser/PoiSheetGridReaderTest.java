package com.pos.pharmacy.importing.spreadsheet.parser;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PoiSheetGridReaderTest {

    @Test
    void fillsHorizontalMergedHeader() throws Exception {
        byte[] bytes;
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet();
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Маҳсулот номи");
            header.createCell(2).setCellValue("Нарх");
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 1));
            Row data = sheet.createRow(1);
            data.createCell(0).setCellValue("Трусы");
            data.createCell(1).setCellValue("06111001017000000");
            data.createCell(2).setCellValue("100");
            bytes = toBytes(wb);
        }
        List<List<String>> grid = PoiSheetGridReader.read(bytes);
        assertEquals(List.of("Маҳсулот номи", "Маҳсулот номи", "Нарх"), grid.get(0));
        assertEquals("Трусы", grid.get(1).get(0));
        assertEquals("06111001017000000", grid.get(1).get(1));
    }

    @Test
    void fillsVerticalMergedHeader() throws Exception {
        byte[] bytes;
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet();
            Row title = sheet.createRow(0);
            title.createCell(0).setCellValue("Маҳсулот");
            title.createCell(1).setCellValue("Идентификация");
            sheet.addMergedRegion(new CellRangeAddress(0, 1, 0, 0));
            Row wrap = sheet.createRow(1);
            wrap.createCell(1).setCellValue("коди");
            Row data = sheet.createRow(2);
            data.createCell(0).setCellValue("Трусы");
            data.createCell(1).setCellValue("06111001017000000");
            bytes = toBytes(wb);
        }
        List<List<String>> grid = PoiSheetGridReader.read(bytes);
        assertEquals("Маҳсулот", grid.get(0).get(0));
        assertEquals("Маҳсулот", grid.get(1).get(0));
        assertEquals("коди", grid.get(1).get(1));
    }

    private static byte[] toBytes(XSSFWorkbook wb) throws Exception {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            wb.write(out);
            return out.toByteArray();
        }
    }
}

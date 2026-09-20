package com.pos.pharmacy.importing.spreadsheet.parser;

import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportColumnHint;
import com.pos.pharmacy.warehouse.support.PharmacyImportGridSupport;
import com.pos.pharmacy.warehouse.support.PharmacyImportRetailResolve;
import com.pos.pharmacy.warehouse.support.PharmacyImportRoles;
import com.pos.pharmacy.warehouse.support.PharmacyImportValueParser;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Реальный Didox PDF: устама → розница с НДС, не сумма ҚҚС. */
class UzInvoicePdfParserUserInvoiceTest {

    @Test
    void menovazinRetailFromUstamaNotVatSum() throws Exception {
        Path pdf = Path.of("src/test/resources/import-samples/user-12.pdf");
        byte[] bytes = Files.readAllBytes(pdf);
        UzInvoicePdfParser parser = new UzInvoicePdfParser(new UzInvoiceSpreadsheetParser());
        PharmacyImportGridSupport support = new PharmacyImportGridSupport(parser, new UzInvoiceSpreadsheetParser());
        List<List<String>> grid = parser.readGrid(bytes);
        int header = support.findHeaderRow(grid);
        List<List<String>> data = support.dataRows(grid, header);
        List<PharmacyImportColumnHint> cols = support.columns(grid.get(header), data);

        Map<String, Integer> roles = new HashMap<>();
        for (PharmacyImportColumnHint col : cols) {
            if (!PharmacyImportRoles.SKIP.equals(col.suggestedRole())) {
                roles.putIfAbsent(col.suggestedRole(), col.index());
            }
        }
        assertEquals(PharmacyImportRoles.MARKUP, cols.get(roles.get(PharmacyImportRoles.MARKUP)).suggestedRole());
        assertTrue(roles.containsKey(PharmacyImportRoles.MARKUP));

        List<String> menov = data.stream()
            .filter(row -> row.get(0).contains("Меновазин"))
            .findFirst()
            .orElseThrow();
        BigDecimal purchase = PharmacyImportValueParser.decimal(menov.get(roles.get(PharmacyImportRoles.PURCHASE)));
        BigDecimal vat = PharmacyImportValueParser.decimal(menov.get(roles.get(PharmacyImportRoles.VAT_RATE)));
        BigDecimal markup = PharmacyImportValueParser.decimal(menov.get(roles.get(PharmacyImportRoles.MARKUP)));
        BigDecimal qty = PharmacyImportValueParser.decimal(menov.get(roles.get(PharmacyImportRoles.QTY)));
        BigDecimal retailRaw = roles.get(PharmacyImportRoles.RETAIL) == null
            ? null
            : PharmacyImportValueParser.decimal(menov.get(roles.get(PharmacyImportRoles.RETAIL)));
        BigDecimal retail = PharmacyImportRetailResolve.resolve(purchase, vat, markup, retailRaw, qty);
        assertEquals(0, new BigDecimal("2140.00").compareTo(retail));
        assertEquals(0, new BigDecimal("100").compareTo(qty));
        assertEquals(0, new BigDecimal("1741.07").compareTo(purchase));
    }
}

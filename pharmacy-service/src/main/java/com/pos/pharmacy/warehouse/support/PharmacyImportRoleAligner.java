package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportColumnHint;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Didox: устама % → MARKUP, «Нарҳ» → RETAIL (без НДС), «12%» → ставка, сумма НДС не роль.
 */
public final class PharmacyImportRoleAligner {

    private PharmacyImportRoleAligner() {}

    public static List<PharmacyImportColumnHint> apply(
        List<PharmacyImportColumnHint> columns,
        List<List<String>> rows
    ) {
        if (columns == null || columns.isEmpty()) {
            return List.of();
        }
        List<PharmacyImportColumnHint> out = new ArrayList<>(columns);
        alignVat(out, rows);
        alignMarkup(out, rows);
        alignRetail(out, rows);
        alignBatch(out, rows);
        return List.copyOf(out);
    }

    private static void alignVat(List<PharmacyImportColumnHint> columns, List<List<String>> rows) {
        int current = indexOf(columns, PharmacyImportRoles.VAT_RATE);
        if (current >= 0 && PharmacyImportRateLook.column(rows, current)) {
            return;
        }
        int found = -1;
        for (PharmacyImportColumnHint column : columns) {
            if (!canTakeVat(column.suggestedRole()) && column.index() != current) {
                continue;
            }
            if (PharmacyImportRateLook.column(rows, column.index())) {
                found = column.index();
                break;
            }
        }
        if (found < 0 || found == current) {
            return;
        }
        replaceRole(columns, current, PharmacyImportRoles.SKIP);
        replaceRole(columns, found, PharmacyImportRoles.VAT_RATE);
    }

    private static void alignMarkup(List<PharmacyImportColumnHint> columns, List<List<String>> rows) {
        int current = indexOf(columns, PharmacyImportRoles.MARKUP);
        if (current >= 0 && PharmacyImportMarkupLook.column(rows, current)) {
            return;
        }
        int found = -1;
        for (PharmacyImportColumnHint column : columns) {
            if (!canTakeMarkup(column.suggestedRole()) && column.index() != current) {
                continue;
            }
            if (PharmacyImportMarkupLook.column(rows, column.index())
                && !PharmacyImportRateLook.column(rows, column.index())) {
                found = column.index();
                break;
            }
        }
        if (found < 0 || found == current) {
            return;
        }
        replaceRole(columns, current, PharmacyImportRoles.SKIP);
        replaceRole(columns, found, PharmacyImportRoles.MARKUP);
    }

    /**
     * Если «розница» попала на сумму НДС строки — сбрасываем; розницу посчитает устама.
     */
    private static void alignRetail(List<PharmacyImportColumnHint> columns, List<List<String>> rows) {
        int retail = indexOf(columns, PharmacyImportRoles.RETAIL);
        if (retail < 0 || rows == null || rows.isEmpty()) {
            return;
        }
        int purchase = indexOf(columns, PharmacyImportRoles.PURCHASE);
        if (purchase < 0) {
            purchase = indexOf(columns, PharmacyImportRoles.PURCHASE_WITH_VAT);
        }
        int qty = indexOf(columns, PharmacyImportRoles.QTY);
        int vat = indexOf(columns, PharmacyImportRoles.VAT_RATE);
        int hits = 0;
        int seen = 0;
        for (List<String> row : rows) {
            if (row == null || retail >= row.size()) {
                continue;
            }
            BigDecimal retailValue = PharmacyImportValueParser.decimal(row.get(retail));
            if (retailValue == null) {
                continue;
            }
            seen++;
            BigDecimal purchaseValue = purchase >= 0 && purchase < row.size()
                ? PharmacyImportValueParser.decimal(row.get(purchase))
                : null;
            BigDecimal qtyValue = qty >= 0 && qty < row.size()
                ? PharmacyImportValueParser.decimal(row.get(qty))
                : null;
            BigDecimal vatValue = vat >= 0 && vat < row.size()
                ? PharmacyImportPercent.vatRate(PharmacyImportValueParser.decimal(row.get(vat)))
                : null;
            if (PharmacyImportRetailResolve.looksLikeVatSum(purchaseValue, vatValue, qtyValue, retailValue)) {
                hits++;
            }
            if (seen >= 8) {
                break;
            }
        }
        if (seen > 0 && hits * 2 >= seen) {
            replaceRole(columns, retail, PharmacyImportRoles.SKIP);
        }
    }

    private static void alignBatch(List<PharmacyImportColumnHint> columns, List<List<String>> rows) {
        int batch = indexOf(columns, PharmacyImportRoles.BATCH);
        if (batch < 0 || !PharmacyImportBatchLook.unitColumn(rows, batch)) {
            return;
        }
        int left = batch - 1;
        if (left < 0 || !PharmacyImportRoles.SKIP.equals(columns.get(left).suggestedRole())) {
            return;
        }
        if (!PharmacyImportBatchLook.seriesColumn(rows, left)) {
            return;
        }
        replaceRole(columns, left, PharmacyImportRoles.BATCH);
        replaceRole(columns, batch, PharmacyImportRoles.SKIP);
    }

    private static boolean canTakeVat(String role) {
        return PharmacyImportRoles.SKIP.equals(role) || PharmacyImportRoles.VAT_RATE.equals(role);
    }

    private static boolean canTakeMarkup(String role) {
        return PharmacyImportRoles.SKIP.equals(role) || PharmacyImportRoles.MARKUP.equals(role);
    }

    private static int indexOf(List<PharmacyImportColumnHint> columns, String role) {
        for (PharmacyImportColumnHint column : columns) {
            if (role.equals(column.suggestedRole())) {
                return column.index();
            }
        }
        return -1;
    }

    private static void replaceRole(List<PharmacyImportColumnHint> columns, int index, String role) {
        if (index < 0 || index >= columns.size()) {
            return;
        }
        PharmacyImportColumnHint previous = columns.get(index);
        columns.set(index, new PharmacyImportColumnHint(previous.index(), previous.header(), role));
    }
}

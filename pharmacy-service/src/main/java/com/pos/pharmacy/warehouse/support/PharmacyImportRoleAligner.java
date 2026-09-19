package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.warehouse.dto.importing.PharmacyImportColumnHint;

import java.util.ArrayList;
import java.util.List;

/**
 * Didox: «Нарх» — розница, «12%» — ставка, сумма НДС и единица измерения не роли.
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

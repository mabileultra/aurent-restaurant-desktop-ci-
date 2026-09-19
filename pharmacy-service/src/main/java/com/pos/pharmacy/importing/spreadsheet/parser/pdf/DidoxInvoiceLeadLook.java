package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

/** Перенос названия/МХИК над следующим № — не к предыдущему товару. */
public final class DidoxInvoiceLeadLook {

    static final float MAX_DY = 18f;

    private DidoxInvoiceLeadLook() {
    }

    public static boolean ofNextProduct(
        java.util.List<PdfVisualLine> lines,
        int index,
        int lastNumber,
        DidoxInvoiceColumnLayout layout
    ) {
        if (lines == null || layout == null || index < 0 || index >= lines.size()) {
            return false;
        }
        float y0 = lines.get(index).y();
        for (int i = index + 1; i < lines.size(); i++) {
            PdfVisualLine line = lines.get(i);
            if (line.y() - y0 > MAX_DY) {
                return false;
            }
            if (DidoxInvoiceColumnLayout.isNumberedHeader(line)) {
                continue;
            }
            java.util.List<String> cells = layout.cells(line);
            Integer number = DidoxInvoiceRowNumbers.leading(cells.isEmpty() ? "" : cells.get(0));
            if (number != null
                && DidoxInvoiceRowSequence.isNext(lastNumber, number)
                && DidoxInvoiceRowAssembler.isNewProduct(cells)) {
                return true;
            }
        }
        return false;
    }
}

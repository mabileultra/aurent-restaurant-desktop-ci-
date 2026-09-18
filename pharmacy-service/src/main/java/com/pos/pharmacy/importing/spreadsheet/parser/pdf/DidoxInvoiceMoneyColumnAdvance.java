package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

/** Если две суммы попали в одну полосу — сдвигает вторую в следующую денежную колонку. */
public final class DidoxInvoiceMoneyColumnAdvance {

    private DidoxInvoiceMoneyColumnAdvance() {}

    public static int column(DidoxInvoiceColumnLayout layout, PdfTextRun run, int previousMoneyCol) {
        int col = DidoxInvoiceBandAssigner.column(layout, run);
        if (!PdfNumericAtom.looksComplete(run.text())) {
            return col;
        }
        if (previousMoneyCol >= 0
            && col <= previousMoneyCol
            && previousMoneyCol + 1 < layout.size()
            && DidoxInvoiceBandAssigner.isMoneyColumn(layout.size(), previousMoneyCol + 1)) {
            return previousMoneyCol + 1;
        }
        return col;
    }
}

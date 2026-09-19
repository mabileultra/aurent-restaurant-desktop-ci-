package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

/** Кладёт текст в полосу Didox по перекрытию, длинный МХИК/имя не пускает в суммы. */
public final class DidoxInvoiceBandAssigner {

    private DidoxInvoiceBandAssigner() {}

    public static int column(DidoxInvoiceColumnLayout layout, PdfTextRun run) {
        if (layout == null || layout.size() == 0 || run == null) {
            return 0;
        }
        int overlap = bestOverlap(layout, run);
        int fromLeft = layout.columnOf(run.x0() + 1f);
        if (PdfNumericAtom.looksPlainInteger(run.text()) && !isMoneyColumn(layout.size(), fromLeft)) {
            return fromLeft;
        }
        if (PdfNumericAtom.looksComplete(run.text())) {
            return overlap;
        }
        if (DidoxInvoiceMxik.first(run.text()) != null && !isMoneyColumn(layout.size(), fromLeft)) {
            if (layout.size() >= 12 && fromLeft < 2 && !isMoneyColumn(layout.size(), 2)) {
                return 2;
            }
            return fromLeft;
        }
        if (!isMoneyColumn(layout.size(), fromLeft)) {
            if (!isMoneyColumn(layout.size(), overlap)
                && overlap != fromLeft
                && overlapScore(layout, run, overlap) > overlapScore(layout, run, fromLeft) + 8f) {
                return overlap;
            }
            return fromLeft;
        }
        return overlap;
    }

    static int bestOverlap(DidoxInvoiceColumnLayout layout, PdfTextRun run) {
        int best = 0;
        float bestScore = -1f;
        for (int i = 0; i < layout.size(); i++) {
            DidoxInvoiceColumnLayout.Band band = layout.band(i);
            float overlap = Math.min(run.x1(), band.right()) - Math.max(run.x0(), band.left());
            if (overlap > bestScore) {
                bestScore = overlap;
                best = i;
            }
        }
        if (bestScore > 0f) {
            return best;
        }
        return layout.columnOf(run.midX());
    }

    static float overlapScore(DidoxInvoiceColumnLayout layout, PdfTextRun run, int index) {
        if (layout == null || run == null || index < 0 || index >= layout.size()) {
            return 0f;
        }
        DidoxInvoiceColumnLayout.Band band = layout.band(index);
        return Math.min(run.x1(), band.right()) - Math.max(run.x0(), band.left());
    }

    static boolean isMoneyColumn(int size, int index) {
        int first = Math.max(0, size - 9);
        int last = Math.max(first, size - 2);
        return index >= first && index <= last;
    }
}

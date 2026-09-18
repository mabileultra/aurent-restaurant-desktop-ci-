package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

/** Кладёт текст в полосу Didox по перекрытию, длинный МХИК/имя не пускает в суммы. */
public final class DidoxInvoiceBandAssigner {

    private DidoxInvoiceBandAssigner() {}

    public static int column(DidoxInvoiceColumnLayout layout, PdfTextRun run) {
        if (layout == null || layout.size() == 0 || run == null) {
            return 0;
        }
        int overlap = bestOverlap(layout, run);
        if (PdfNumericAtom.looksComplete(run.text())) {
            return overlap;
        }
        int fromLeft = layout.columnOf(run.x0() + 1f);
        if (!isMoneyColumn(layout.size(), fromLeft)) {
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

    static boolean isMoneyColumn(int size, int index) {
        int first = Math.max(0, size - 9);
        int last = Math.max(first, size - 2);
        return index >= first && index <= last;
    }
}

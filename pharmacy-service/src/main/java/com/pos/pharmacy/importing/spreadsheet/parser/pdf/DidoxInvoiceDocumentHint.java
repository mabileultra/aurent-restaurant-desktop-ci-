package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.List;
import java.util.Locale;

/** Hisob-faktura Didox: запасной gap-builder без пустых ячеек ломает колонки. */
public final class DidoxInvoiceDocumentHint {

    private DidoxInvoiceDocumentHint() {}

    public static boolean isHisobFaktura(List<PdfVisualLine> lines) {
        if (lines == null) {
            return false;
        }
        int limit = Math.min(lines.size(), 40);
        for (int i = 0; i < limit; i++) {
            String text = lines.get(i).joined().toLowerCase(Locale.ROOT);
            if (text.contains("ҳисобварак") || text.contains("hisobvaraq")
                || text.contains("ҳисоб-фактура") || text.contains("hisob-faktura")
                || text.contains("didox.uz")) {
                return true;
            }
        }
        return false;
    }
}

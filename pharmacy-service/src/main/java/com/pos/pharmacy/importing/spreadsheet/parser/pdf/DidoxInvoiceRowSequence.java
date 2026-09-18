package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

/** Следующий № товара: 1,2,3… а не «50шт» и не повтор шапки. */
public final class DidoxInvoiceRowSequence {

    private DidoxInvoiceRowSequence() {}

    public static boolean isNext(int lastNumber, int candidate) {
        if (candidate < 1 || candidate > 999) {
            return false;
        }
        if (lastNumber <= 0) {
            return candidate <= 20;
        }
        return candidate > lastNumber && candidate <= lastNumber + 5;
    }
}

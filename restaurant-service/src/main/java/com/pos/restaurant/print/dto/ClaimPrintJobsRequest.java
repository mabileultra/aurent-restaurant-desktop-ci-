package com.pos.restaurant.print.dto;

import java.util.List;

/**
 * Desktop capabilities — server only returns jobs this station can print.
 * Wrong-printer jobs are released in the same transaction (no client-side lock).
 */
public record ClaimPrintJobsRequest(
    List<String> printerNames,
    boolean guestBill,
    boolean kitchenSend,
    /** Cashier receipt printer — claims ORDER_CANCEL slips. */
    boolean orderCancel,
    Integer limit,
    /** Category printers whose local lane is full or cooling down after an error — skip their slips. */
    List<String> busyPrinters,
    /** Max category slips per printer in one claim (fair share across stations). */
    Integer perPrinterLimit
) {
    /** Backward-compatible ctor for older desktop clients. */
    public ClaimPrintJobsRequest(
        List<String> printerNames,
        boolean guestBill,
        boolean kitchenSend,
        Integer limit,
        List<String> busyPrinters,
        Integer perPrinterLimit
    ) {
        this(printerNames, guestBill, kitchenSend, false, limit, busyPrinters, perPrinterLimit);
    }
}

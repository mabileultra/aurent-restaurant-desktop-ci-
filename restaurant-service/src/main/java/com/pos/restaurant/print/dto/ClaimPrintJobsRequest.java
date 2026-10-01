package com.pos.restaurant.print.dto;

import java.util.List;

/**
 * Desktop capabilities — server only returns jobs this station can print.
 * Wrong-printer jobs are released in the same transaction (no client-side lock).
 */
public record ClaimPrintJobsRequest(
    List<String> printerNames,
    boolean guestBill,
    boolean kitchenSend
) {}

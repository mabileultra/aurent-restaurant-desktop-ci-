package com.pos.pharmacy.warehouse.support;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/** Формат складского номера прихода: REC-yyyyMMdd-0001. */
@Component
public class PharmacyReceiptNumberFormat {

    private static final DateTimeFormatter DAY = DateTimeFormatter.BASIC_ISO_DATE;
    private static final String KIND = "REC-";

    public String prefix(LocalDate date) {
        return KIND + date.format(DAY) + "-";
    }

    public String format(LocalDate date, int sequence) {
        return prefix(date) + String.format("%04d", sequence);
    }

    public int sequence(String receiptNumber, String prefix) {
        if (receiptNumber == null || prefix == null || !receiptNumber.startsWith(prefix)) {
            return 0;
        }
        try {
            return Integer.parseInt(receiptNumber.substring(prefix.length()).trim());
        } catch (NumberFormatException ex) {
            return 0;
        }
    }
}

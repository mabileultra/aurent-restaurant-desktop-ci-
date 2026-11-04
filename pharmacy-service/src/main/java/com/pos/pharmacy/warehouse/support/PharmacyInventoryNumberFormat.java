package com.pos.pharmacy.warehouse.support;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/** INV-yyyyMMdd-0001 */
@Component
public class PharmacyInventoryNumberFormat {

    private static final DateTimeFormatter DAY = DateTimeFormatter.BASIC_ISO_DATE;
    private static final String KIND = "INV-";

    public String prefix(LocalDate date) {
        return KIND + date.format(DAY) + "-";
    }

    public String format(LocalDate date, int sequence) {
        return prefix(date) + String.format("%04d", sequence);
    }

    public int sequence(String number, String prefix) {
        if (number == null || prefix == null || !number.startsWith(prefix)) {
            return 0;
        }
        try {
            return Integer.parseInt(number.substring(prefix.length()).trim());
        } catch (NumberFormatException ex) {
            return 0;
        }
    }
}

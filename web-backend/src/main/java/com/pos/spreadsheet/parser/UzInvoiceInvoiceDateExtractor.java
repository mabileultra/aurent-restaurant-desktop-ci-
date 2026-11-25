package com.pos.spreadsheet.parser;

import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Дата счёт-фактуры из шапки Didox/Soliq (напр. «23.05.2026 даги 2683-сонли»).
 */
public final class UzInvoiceInvoiceDateExtractor {

    public static final String ROW_KEY_INVOICE_DATE = "uz_invoice_invoice_date";

    private static final int MAX_SCAN_ROWS = 500;

    /** «23.05.2026 даги …-сонли» — дата фактуры, не договора («… шартномага»). */
    private static final Pattern DATE_BEFORE_DAGI = Pattern.compile(
        "(?iu)(\\d{1,2}[./]\\d{1,2}[./]\\d{4})\\s*даги\\s+\\d{1,12}-(?:сонли|sonli)"
            + "(?!\\s*(?:шартном|shartnom|договор|dogovor|contract))"
    );

    private static final Pattern ISO_OR_DOT = Pattern.compile(
        "(\\d{4}-\\d{2}-\\d{2})|(\\d{1,2}[./]\\d{1,2}[./]\\d{4})"
    );

    private static final DateTimeFormatter[] FORMATTERS = {
        DateTimeFormatter.ISO_LOCAL_DATE,
        DateTimeFormatter.ofPattern("d.M.uuuu"),
        DateTimeFormatter.ofPattern("d/M/uuuu"),
    };

    private UzInvoiceInvoiceDateExtractor() {
    }

    public static String extractFromGrid(List<List<String>> grid) {
        if (grid == null || grid.isEmpty()) {
            return null;
        }
        int limit = Math.min(MAX_SCAN_ROWS, grid.size());
        for (int r = 0; r < limit; r++) {
            List<String> row = grid.get(r);
            if (row == null) {
                continue;
            }
            for (String cell : row) {
                String hit = extractFromPlainText(cell);
                if (hit != null) {
                    return hit;
                }
            }
        }
        return null;
    }

    public static String extractFromPlainText(String text) {
        if (!StringUtils.hasText(text)) {
            return null;
        }
        Matcher dagi = DATE_BEFORE_DAGI.matcher(text);
        if (dagi.find()) {
            return toIso(dagi.group(1));
        }
        String lower = text.toLowerCase(Locale.ROOT);
        boolean looksDateLabel = lower.contains("дата") || lower.contains("sana") || lower.contains("date");
        if (!looksDateLabel) {
            return null;
        }
        Matcher any = ISO_OR_DOT.matcher(text);
        if (any.find()) {
            String raw = any.group(1) != null ? any.group(1) : any.group(2);
            return toIso(raw);
        }
        return null;
    }

    private static String toIso(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        String s = raw.trim().replace('/', '.');
        for (DateTimeFormatter fmt : FORMATTERS) {
            try {
                LocalDate d = LocalDate.parse(s.contains("-") ? raw.trim() : s, fmt);
                return d.toString();
            } catch (DateTimeParseException ignored) {
                // try next
            }
        }
        return null;
    }
}

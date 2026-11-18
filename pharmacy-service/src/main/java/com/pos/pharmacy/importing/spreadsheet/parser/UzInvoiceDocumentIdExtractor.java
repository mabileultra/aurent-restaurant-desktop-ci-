package com.pos.pharmacy.importing.spreadsheet.parser;

import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Номер электронного счёт-фактуры (напр. Didox/Soliq):
 * <ul>
 *   <li>{@code IS-00008429} — «… даги IS-00008429-сонли»</li>
 *   <li>числовой «… даги 2683-сонли» из Excel (без портального ID Didox)</li>
 * </ul>
 * Не путать с договором «… даги 481-сонли шартномага» и кодом клиента {@code CLI-12937}.
 */
public final class UzInvoiceDocumentIdExtractor {

    /** Ключ строки после парсера (совпадает с колонкой в БД snake_case через маппер импорта). */
    public static final String ROW_KEY_UZ_INVOICE_DOCUMENT_ID = "uz_invoice_document_id";

    /** Номер фактуры иногда ниже большой шапки; верхний предел строк при поиске. */
    private static final int MAX_SCAN_ROWS = 500;

    /** Типичный формат Uzbek e-invoice number (латиница после цифр и дефиса — `\b` срабатывает до кириллицы). */
    private static final Pattern IS_STYLE_ID = Pattern.compile("(?i)\\b(IS-\\d+)\\b");

    /** Вариант без пробела между IS и номером. */
    private static final Pattern IS_COMPACT = Pattern.compile("(?i)\\b(IS\\d{6,})\\b");

    /**
     * Excel Didox: «23.05.2026 даги 2683-сонли».
     * Не матчит договор: «14.01.2026 даги 481-сонли шартномага».
     */
    private static final Pattern SONLI_INVOICE = Pattern.compile(
        "(?iu)даги\\s+(\\d{1,12})-(?:сонли|sonli)(?!\\s*(?:шартном|shartnom|договор|dogovor|contract))"
    );

    /**
     * Другие префиксы документов (не клиентские коды): ≥6 цифр после дефиса,
     * без повторной ловни коротких фрагментов вроде {@code Z-93} / {@code CLI-12937}.
     */
    private static final Pattern PREFIX_DIGITS_ID =
        Pattern.compile("(?i)\\b([A-Z]{2,12}-\\d{6,})(?:/[A-Za-z0-9.-]+)?\\b");

    /** Префиксы шапки Didox/банка/налоговых реквизитов — это не номер счёт-фактуры. */
    private static final Set<String> NON_INVOICE_PREFIXES = Set.of(
        "CLI", "INN", "TIN", "PIN", "PINFL", "VAT", "STIR", "OKED", "MFO", "SWIFT", "IBAN", "USD", "UZS"
    );

    private UzInvoiceDocumentIdExtractor() {
    }

    /** Сканирует сетку счёт-фактуры до {@link #MAX_SCAN_ROWS} строк (номер может быть ниже большой шапки). */
    public static String extractFromGrid(List<List<String>> grid) {
        if (grid == null || grid.isEmpty()) {
            return null;
        }
        int limit = Math.min(MAX_SCAN_ROWS, grid.size());
        String isHit = scanGrid(grid, limit, true);
        if (isHit != null) {
            return isHit;
        }
        return scanGrid(grid, limit, false);
    }

    private static String scanGrid(List<List<String>> grid, int limit, boolean isOnly) {
        for (int r = 0; r < limit; r++) {
            List<String> row = grid.get(r);
            if (row == null) {
                continue;
            }
            for (String cell : row) {
                String hit = isOnly ? extractIsStyle(cell) : extractGeneric(cell);
                if (hit != null) {
                    return hit;
                }
            }
        }
        return null;
    }

    public static String extractFromPlainText(String text) {
        String is = extractIsStyle(text);
        if (is != null) {
            return is;
        }
        return extractGeneric(text);
    }

    private static String extractIsStyle(String text) {
        if (!StringUtils.hasText(text)) {
            return null;
        }
        Matcher is = IS_STYLE_ID.matcher(text);
        if (is.find()) {
            return is.group(1).toUpperCase(Locale.ROOT);
        }
        Matcher isCompact = IS_COMPACT.matcher(text);
        if (isCompact.find()) {
            String raw = isCompact.group(1).toUpperCase(Locale.ROOT);
            if (raw.length() > 2) {
                return "IS-" + raw.substring(2);
            }
        }
        return null;
    }

    private static String extractGeneric(String text) {
        if (!StringUtils.hasText(text)) {
            return null;
        }
        String sonli = extractSonliInvoice(text);
        if (sonli != null) {
            return sonli;
        }
        Matcher gen = PREFIX_DIGITS_ID.matcher(text);
        while (gen.find()) {
            String token = normalizeToken(gen.group(1));
            if (token == null) {
                continue;
            }
            int dash = token.indexOf('-');
            String prefix = dash > 0 ? token.substring(0, dash) : token;
            if (NON_INVOICE_PREFIXES.contains(prefix)) {
                continue;
            }
            return token;
        }
        return null;
    }

    /**
     * Номер фактуры из «даги N-сонли». Договор («… сонли шартномага») и голый портальный ID Didox
     * не извлекаются.
     */
    private static String extractSonliInvoice(String text) {
        Matcher m = SONLI_INVOICE.matcher(text);
        if (!m.find()) {
            return null;
        }
        String num = m.group(1);
        if (!StringUtils.hasText(num)) {
            return null;
        }
        return num.trim();
    }

    private static String normalizeToken(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        return raw.trim().toUpperCase(Locale.ROOT);
    }
}

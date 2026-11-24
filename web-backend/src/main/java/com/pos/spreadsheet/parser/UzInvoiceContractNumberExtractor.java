package com.pos.spreadsheet.parser;

import org.springframework.util.StringUtils;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Номер договора из шапки Didox/Soliq: «14.01.2026 даги 481-сонли шартномага».
 * Не путать с номером фактуры («… даги 2683-сонли» без шартнома).
 */
public final class UzInvoiceContractNumberExtractor {

    public static final String ROW_KEY_CONTRACT_NUMBER = "uz_invoice_contract_number";

    private static final int MAX_SCAN_ROWS = 500;

    private static final Pattern SONLI_CONTRACT = Pattern.compile(
        "(?iu)даги\\s+(\\d{1,12})-(?:сонли|sonli)\\s*(?:шартном\\w*|shartnom\\w*|договор\\w*|dogovor\\w*|contract\\w*)"
    );

    private UzInvoiceContractNumberExtractor() {
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
        Matcher m = SONLI_CONTRACT.matcher(text);
        if (m.find()) {
            return m.group(1);
        }
        return null;
    }
}

package com.pos.shared.api;

/**
 * Shared text filter normalization (search boxes on list/report APIs).
 */
public final class FilterText {

    public static final int MAX_SEARCH = 64;

    private FilterText() {
    }

    /**
     * Trim; blank → null; longer than {@link #MAX_SEARCH} → truncated.
     */
    public static String normalizeSearch(String raw) {
        if (raw == null) {
            return null;
        }
        String term = raw.trim();
        if (term.isEmpty()) {
            return null;
        }
        if (term.length() > MAX_SEARCH) {
            return term.substring(0, MAX_SEARCH);
        }
        return term;
    }
}

package com.pos.shared.api;

/**
 * Shared pagination caps for all POS microservices.
 * Controllers/services must normalize {@code page}/{@code size} through this class.
 */
public final class PageLimits {

    public static final int DEFAULT_SIZE = 20;
    public static final int MAX_SIZE = 100;
    /** Receipt journal / heavy admin tables may allow a larger page. */
    public static final int MAX_SIZE_REPORT = 200;

    private PageLimits() {
    }

    public static int normalizePage(int page) {
        return Math.max(page, 0);
    }

    public static int normalizeSize(int size) {
        return normalizeSize(size, MAX_SIZE);
    }

    public static int normalizeReportSize(int size) {
        return normalizeSize(size, MAX_SIZE_REPORT);
    }

    public static int normalizeSize(int size, int maxSize) {
        int cap = Math.max(maxSize, 1);
        if (size <= 0) {
            return DEFAULT_SIZE;
        }
        return Math.min(size, cap);
    }
}

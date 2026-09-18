package com.pos.pharmacy.config;

/** Имена Spring-бинов пулов аптеки (фаза 0). */
public final class PharmacyExecutorNames {

    public static final String MARK_VERIFY = "pharmacyMarkVerifyExecutor";
    public static final String MARK_WITHDRAW = "pharmacyMarkWithdrawExecutor";
    public static final String IMPORT = "pharmacyImportExecutor";
    public static final String CATALOG = "pharmacyCatalogExecutor";

    private PharmacyExecutorNames() {
    }
}

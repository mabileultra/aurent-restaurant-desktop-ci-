package com.pos.pharmacy.pricing.registry.domain;

public enum PriceChangeJournalStatus {
    /** Наша цена выше предела — ждёт применения. */
    PENDING,
    /** Цена снижена до предела. */
    APPLIED,
    /** Наша ≤ предела — менять не нужно. */
    SKIPPED_OK,
    /** Строка реестра не сопоставлена с товаром. */
    UNMATCHED
}

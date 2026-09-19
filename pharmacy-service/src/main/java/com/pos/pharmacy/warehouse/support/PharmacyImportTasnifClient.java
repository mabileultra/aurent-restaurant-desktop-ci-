package com.pos.pharmacy.warehouse.support;

/** Поиск карточки МХИК в тасниф. Ошибки сети не роняют импорт. */
public interface PharmacyImportTasnifClient {

    /** miss() — код не найден. null — сеть/ошибка, строка идёт без тасниф. */
    PharmacyImportTasnifHit fetch(String mxik);
}

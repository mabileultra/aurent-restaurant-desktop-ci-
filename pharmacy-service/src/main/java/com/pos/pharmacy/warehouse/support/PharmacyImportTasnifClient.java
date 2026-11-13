package com.pos.pharmacy.warehouse.support;

/** Поиск карточки МХИК в тасниф. Ошибки сети не роняют импорт. */
public interface PharmacyImportTasnifClient {

    /** miss() — код не найден. null — сеть/ошибка, строка идёт без тасниф. */
    PharmacyImportTasnifHit fetch(String mxik);

    /** По штрихкоду (shtrixCode). */
    PharmacyImportTasnifHit fetchByBarcode(String barcode);

    /** По тексту названия; точное имя или единственный hit. */
    PharmacyImportTasnifHit searchByName(String name);
}

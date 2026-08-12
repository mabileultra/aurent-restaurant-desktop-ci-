package com.pos.scales.domain;

/**
 * Профиль весового штрихкода на этикетке.
 * Новые форматы вендоров добавляются сюда; касса выбирает профиль при decode.
 */
public enum ScaleLabelProfile {
    /** Aurent: 20 + PLU(5) + граммы(5) + EAN check */
    AURENT_20_WEIGHT
}

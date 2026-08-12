package com.pos.scales.service;

import com.pos.scales.dto.ScalePluExportResponse;

public interface ScalePluExportService {

    /**
     * Пакет PLU для desktop-адаптера умных весов.
     * @param onlyWithPlu если true — только товары с назначенным PLU
     * @param storeId опционально цена магазина
     */
    ScalePluExportResponse exportPluCatalog(boolean onlyWithPlu, Integer storeId);
}

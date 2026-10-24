package com.pos.integrations.marking.service.impl;

import com.pos.integrations.marking.service.MarkingAfterSaleService;
import com.pos.integrations.pharmacy.config.PharmacyAslExecutorNames;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MarkingAfterSaleServiceImpl implements MarkingAfterSaleService {

    @Override
    @Async(PharmacyAslExecutorNames.MARK_WITHDRAW)
    public void enqueueAfterSale(Integer storeId, List<String> codes, boolean fiscalConfirmed) {
        // Розничный вывод — только ОФД Labels. ASL Belgisi не вызываем.
    }
}

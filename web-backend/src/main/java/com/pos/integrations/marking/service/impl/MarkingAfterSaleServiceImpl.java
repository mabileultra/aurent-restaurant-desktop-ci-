package com.pos.integrations.marking.service.impl;

import com.pos.integrations.marking.service.MarkingAfterSaleService;
import com.pos.integrations.pharmacy.config.PharmacyAslExecutorNames;
import com.pos.integrations.pharmacy.dto.MarkingWithdrawRequest;
import com.pos.integrations.pharmacy.dto.MarkingWithdrawResponse;
import com.pos.integrations.pharmacy.service.PharmacyMarkingWithdrawService;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MarkingAfterSaleServiceImpl implements MarkingAfterSaleService {

    private final PharmacyMarkingWithdrawService withdrawService;

    @Override
    @Async(PharmacyAslExecutorNames.MARK_WITHDRAW)
    public void enqueueAfterSale(Integer storeId, List<String> codes, boolean fiscalConfirmed) {
        if (storeId == null || codes == null || codes.isEmpty()) {
            return;
        }
        try {
            MarkingWithdrawResponse first = withdrawService.withdraw(
                new MarkingWithdrawRequest(storeId, codes, Boolean.FALSE)
            );
            if (isSettled(first)) {
                return;
            }
            if (fiscalConfirmed) {
                withdrawService.withdraw(new MarkingWithdrawRequest(storeId, codes, Boolean.TRUE));
            }
        } catch (Exception ex) {
            LogUtil.warn(
                MarkingAfterSaleServiceImpl.class,
                "ASL withdraw after sale failed storeId={}: {}",
                storeId,
                ex.getMessage()
            );
        }
    }

    private static boolean isSettled(MarkingWithdrawResponse response) {
        return response != null && response.pending() == 0 && response.failed() == 0;
    }
}

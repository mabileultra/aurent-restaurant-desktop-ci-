package com.pos.pharmacy.marks.support;

import com.pos.pharmacy.marks.entity.StockMark;
import com.pos.pharmacy.marks.entity.StockMarkStatus;
import org.springframework.util.StringUtils;

/**
 * Когда КМ нужно показать в админ-мониторинге как проблему (ASL ещё не подтвердил выбытие).
 */
public final class StockMarkMonitorAttention {

    private StockMarkMonitorAttention() {
    }

    public static boolean needsAttention(StockMark row) {
        if (row == null) {
            return false;
        }
        return needsAttention(row.getStatus(), row.getLastWithdrawError());
    }

    public static boolean needsAttention(StockMarkStatus status, String lastWithdrawError) {
        return status == StockMarkStatus.PENDING_WITHDRAW
            || StringUtils.hasText(lastWithdrawError);
    }
}

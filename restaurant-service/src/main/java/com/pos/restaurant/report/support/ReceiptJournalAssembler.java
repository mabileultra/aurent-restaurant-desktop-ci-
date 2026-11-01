package com.pos.restaurant.report.support;

import com.pos.restaurant.analytics.support.AnalyticsStaffNameResolver;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.restaurant.report.dto.ReceiptJournalRow;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ReceiptJournalAssembler {

    private final ReceiptJournalLoader loader;
    private final AnalyticsStaffNameResolver staffNameResolver;

    public List<ReceiptJournalRow> toRows(List<FloorOrderPayment> payments) {
        if (payments == null || payments.isEmpty()) {
            return List.of();
        }
        List<UUID> orderIds = ReceiptJournalLoader.orderIds(payments);
        Map<UUID, BigDecimal> returned = loader.returnedAmounts(orderIds);
        Map<UUID, String> names = staffNameResolver.namesByIds(staffIds(payments));
        return payments.stream()
            .map(p -> ReceiptJournalRowMapper.toRow(p, returned.get(p.getOrder().getId()), names))
            .toList();
    }

    private static Set<UUID> staffIds(List<FloorOrderPayment> payments) {
        Set<UUID> ids = new HashSet<>();
        for (FloorOrderPayment payment : payments) {
            if (payment.getOrder().getWaiterUserId() != null) {
                ids.add(payment.getOrder().getWaiterUserId());
            }
            if (payment.getPaidByUserId() != null) {
                ids.add(payment.getPaidByUserId());
            }
        }
        return ids;
    }
}

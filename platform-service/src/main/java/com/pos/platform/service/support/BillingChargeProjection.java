package com.pos.platform.service.support;

import com.pos.platform.domain.BillingPaymentState;
import com.pos.platform.dto.billing.CompanyPaymentRowResponse;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Будущие ежемесячные списания: nextChargeAt + k × {@link BillingTime#PERIOD_DAYS}.
 * Приостановленные и компании без тарифа не прогнозируются.
 */
@Component
public class BillingChargeProjection {

    public List<ProjectedCharge> project(List<CompanyPaymentRowResponse> rows, LocalDate from, LocalDate toInclusive) {
        List<ProjectedCharge> out = new ArrayList<>();
        for (CompanyPaymentRowResponse row : rows) {
            if (row.paymentState() == BillingPaymentState.SUSPENDED
                || row.paymentState() == BillingPaymentState.NOT_BILLED
                || row.billing().nextChargeAt() == null) {
                continue;
            }
            BigDecimal amount = row.billing().monthlyTotal();
            if (amount == null || amount.signum() <= 0) {
                continue;
            }
            LocalDate due = LocalDate.ofInstant(row.billing().nextChargeAt(), BillingTime.ZONE);
            while (due.isBefore(from)) {
                due = due.plusDays(BillingTime.PERIOD_DAYS);
            }
            while (!due.isAfter(toInclusive)) {
                out.add(new ProjectedCharge(due, row, amount));
                due = due.plusDays(BillingTime.PERIOD_DAYS);
            }
        }
        out.sort(Comparator.comparing(ProjectedCharge::date));
        return out;
    }

    public record ProjectedCharge(LocalDate date, CompanyPaymentRowResponse row, BigDecimal amount) {}
}

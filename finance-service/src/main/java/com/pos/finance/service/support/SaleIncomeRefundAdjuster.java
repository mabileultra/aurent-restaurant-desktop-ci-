package com.pos.finance.service.support;

import com.pos.finance.entity.Income;
import com.pos.finance.entity.IncomeSourceType;
import com.pos.finance.repository.IncomeRepository;
import com.pos.finance.service.support.AccountBalanceSupport;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class SaleIncomeRefundAdjuster {

    private final IncomeRepository incomeRepository;
    private final AccountBalanceSupport balanceSupport;

    public boolean reduce(Integer companyId, UUID saleId, BigDecimal cashRefund, BigDecimal cardRefund) {
        if (companyId == null || saleId == null) {
            return false;
        }
        List<Income> incomes = incomeRepository.findAllByCompanyIdAndSourceTypeAndSourceIdAndDeletedFalse(
            companyId, IncomeSourceType.SALE, saleId.toString()
        );
        if (incomes.isEmpty()) {
            return false;
        }
        List<SaleIncomeRefundMath.Slice> slices = incomes.stream()
            .map(income -> new SaleIncomeRefundMath.Slice(
                income.getId(),
                income.getPaymentMethod() != null ? income.getPaymentMethod().name() : "CASH",
                income.getAmount()
            ))
            .toList();
        List<SaleIncomeRefundMath.Adjustment> adjustments = SaleIncomeRefundMath.reduce(slices, cashRefund, cardRefund);
        if (adjustments.isEmpty()) {
            return false;
        }
        for (SaleIncomeRefundMath.Adjustment adjustment : adjustments) {
            incomes.stream()
                .filter(income -> income.getId().equals(adjustment.id()))
                .findFirst()
                .ifPresent(income -> apply(income, adjustment));
        }
        LogUtil.info(
            SaleIncomeRefundAdjuster.class,
            "Sale income reduced after refund: sale={}, adjustments={}",
            saleId,
            adjustments.size()
        );
        return true;
    }

    private void apply(Income income, SaleIncomeRefundMath.Adjustment adjustment) {
        BigDecimal delta = adjustment.previousAmount().subtract(adjustment.newAmount());
        income.setAmount(adjustment.newAmount());
        incomeRepository.save(income);
        if (delta.signum() > 0 && income.getAccount() != null) {
            balanceSupport.debit(income.getAccount(), delta);
        }
    }
}

package com.pos.finance.service.support;

import com.pos.finance.entity.Income;
import com.pos.finance.entity.IncomeSourceType;
import com.pos.finance.repository.IncomeRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DuplicateZReportIncomeReversal {

    private final IncomeRepository incomeRepository;
    private final CashRegisterIncomePolicy incomePolicy;
    private final AccountBalanceSupport balanceSupport;

    public int reverseIfSaleLedgerExists(Integer companyId) {
        return doReverse(companyId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int reverseIsolated(Integer companyId) {
        return doReverse(companyId);
    }

    private int doReverse(Integer companyId) {
        if (companyId == null || !incomePolicy.prefersSaleLedger(companyId)) {
            return 0;
        }
        List<Income> duplicates = incomeRepository.findUndeletedWithAccount(
            companyId,
            IncomeSourceType.Z_REPORT
        );
        if (duplicates.isEmpty()) {
            return 0;
        }
        for (Income income : duplicates) {
            balanceSupport.reverseCredit(income.getAccount(), income.getAmount());
            income.setDeleted(true);
            incomeRepository.save(income);
        }
        LogUtil.warn(
            DuplicateZReportIncomeReversal.class,
            "Reversed duplicate Z-report incomes: companyId={}, count={}",
            companyId,
            duplicates.size()
        );
        return duplicates.size();
    }
}

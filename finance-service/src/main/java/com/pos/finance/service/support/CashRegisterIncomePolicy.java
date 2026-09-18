package com.pos.finance.service.support;

import com.pos.finance.entity.IncomeSourceType;
import com.pos.finance.repository.IncomeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Кассовая выручка не должна считаться дважды: SALE на чеке и Z_REPORT на закрытии.
 * Если у компании уже есть SALE — это источник правды (совпадает с обзором по дате продажи).
 * Z остаётся только у старых компаний, куда чеки не синкались.
 */
@Component
@RequiredArgsConstructor
public class CashRegisterIncomePolicy {

    private final IncomeRepository incomeRepository;

    public boolean prefersSaleLedger(Integer companyId) {
        return incomeRepository.existsByCompanyIdAndSourceTypeAndDeletedFalse(
            companyId,
            IncomeSourceType.SALE
        );
    }

    public IncomeSourceType registerSource(Integer companyId) {
        return prefersSaleLedger(companyId) ? IncomeSourceType.SALE : IncomeSourceType.Z_REPORT;
    }
}

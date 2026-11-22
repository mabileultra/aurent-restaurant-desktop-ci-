package com.pos.sales.support;

import com.pos.catalog.entity.Category;
import com.pos.sales.entity.CashRegisterConfig;
import com.pos.sales.repository.CashRegisterConfigRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Resolves which product categories a cash register may show on POS.
 * <p>
 * Match rules (company-scoped configs):
 * <ul>
 *   <li>Config lists this {@code cashRegisterId} → match</li>
 *   <li>Else config has no registers and lists {@code storeId} → match (all tills at store)</li>
 * </ul>
 * No matches → unrestricted. Several matches → union of their categories.
 */
@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CashRegisterCategoryScopeResolver {

    private final CashRegisterConfigRepository configRepository;

    public CashRegisterCategoryScope resolve(Integer storeId, Long cashRegisterId) {
        if (storeId == null && cashRegisterId == null) {
            return CashRegisterCategoryScope.unrestricted();
        }
        List<CashRegisterConfig> candidates = configRepository.findCandidatesForPosScope(storeId, cashRegisterId);
        if (candidates.isEmpty()) {
            return CashRegisterCategoryScope.unrestricted();
        }
        Set<Integer> allowed = new HashSet<>();
        int matched = 0;
        for (CashRegisterConfig cfg : candidates) {
            if (!matches(cfg, storeId, cashRegisterId)) {
                continue;
            }
            matched++;
            if (cfg.getCategories() != null) {
                for (Category c : cfg.getCategories()) {
                    if (c != null && c.getId() != null) {
                        allowed.add(c.getId());
                    }
                }
            }
        }
        if (matched == 0) {
            return CashRegisterCategoryScope.unrestricted();
        }
        LogUtil.info(
            CashRegisterCategoryScopeResolver.class,
            "POS category scope: storeId={}, registerId={}, configs={}, categories={}",
            storeId,
            cashRegisterId,
            matched,
            allowed.size()
        );
        return CashRegisterCategoryScope.of(allowed);
    }

    static boolean matches(CashRegisterConfig cfg, Integer storeId, Long cashRegisterId) {
        if (cfg == null || cfg.isLockedDefault()) {
            return false;
        }
        boolean hasRegisters = cfg.getRegisters() != null && !cfg.getRegisters().isEmpty();
        if (hasRegisters) {
            if (cashRegisterId == null) {
                return false;
            }
            return cfg.getRegisters().stream().anyMatch(r -> r != null && cashRegisterId.equals(r.getId()));
        }
        if (storeId == null || cfg.getStores() == null || cfg.getStores().isEmpty()) {
            return false;
        }
        return cfg.getStores().stream().anyMatch(s -> s != null && storeId.equals(s.getId()));
    }
}

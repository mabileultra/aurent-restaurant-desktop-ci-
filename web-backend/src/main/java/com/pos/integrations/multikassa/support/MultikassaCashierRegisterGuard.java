package com.pos.integrations.multikassa.support;

import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.sales.entity.CashRegister;
import com.pos.sales.entity.CashierShift;
import com.pos.sales.repository.CashierShiftRepository;
import com.pos.security.RoleName;
import com.pos.service.support.CashierSaleSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

/**
 * Кассир может править Multikassa на кассе своей открытой grocery-смены.
 * Для аптеки (смена в pharmacy-service) — на любой кассе магазина, куда кассиру разрешены продажи.
 * ADMIN / MANAGER / SUPER_ADMIN — без этого ограничения.
 */
@Component
@RequiredArgsConstructor
public class MultikassaCashierRegisterGuard {

    private final CashierShiftRepository cashierShiftRepository;
    private final CashierSaleSupport cashierSaleSupport;

    public void assertCashierMayConfigureRegister(User user, CashRegister register) {
        if (user == null || register == null) {
            throw new BadRequestException("Касса не найдена");
        }
        if (RoleName.SUPER_ADMIN.matches(user)
            || RoleName.TENANT_ADMIN.matches(user)
            || RoleName.MANAGER.matches(user)) {
            return;
        }
        if (!RoleName.CASHIER.matches(user)) {
            throw new AccessDeniedException("Недостаточно прав для настроек Multikassa");
        }
        Integer storeId = register.getStore() != null ? register.getStore().getId() : null;
        if (storeId == null) {
            throw new BadRequestException("У кассы не указан магазин");
        }
        boolean ownsOpenShift = cashierShiftRepository
            .findByCashierIdAndStoreIdAndStatus(user.getId(), storeId, CashierShift.ShiftStatus.OPEN)
            .map(CashierShift::getCashRegister)
            .filter(cr -> cr != null && register.getId().equals(cr.getId()))
            .isPresent();
        if (ownsOpenShift) {
            return;
        }
        try {
            cashierSaleSupport.requireStoreForSale(user, storeId);
        } catch (RuntimeException ex) {
            throw new AccessDeniedException(
                "Кассир может настраивать Multikassa только на кассе своей открытой смены"
            );
        }
    }
}

package com.pos.sales.support.cashlimit;

import com.pos.catalog.entity.Product;
import com.pos.exception.BadRequestException;
import com.pos.operator.OperatorBrvService;
import com.pos.sales.entity.Sale;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CashPaymentRestrictionGuardTest {

    @Mock
    private OperatorBrvService operatorBrvService;

    private CashPaymentRestrictionGuard guard;

    @BeforeEach
    void setUp() {
        guard = new CashPaymentRestrictionGuard(operatorBrvService);
    }

    @Test
    void allowsCardWithoutCashCheck() {
        Product p = product("Beer");
        assertDoesNotThrow(() -> guard.assertCashAllowed(
            Sale.PaymentMethod.CARD,
            BigDecimal.ZERO,
            List.of(p),
            Map.of(p.getId(), Map.of(CashRestrictionCategory.ATTR_KEY, "ALCOHOL"))
        ));
    }

    @Test
    void rejectsAlcoholCash() {
        Product p = product("Beer");
        BadRequestException ex = assertThrows(BadRequestException.class, () -> guard.assertCashAllowed(
            Sale.PaymentMethod.CASH,
            new BigDecimal("10000"),
            List.of(p),
            Map.of(p.getId(), Map.of(CashRestrictionCategory.ATTR_KEY, "ALCOHOL"))
        ));
        assertEquals(CashPaymentRestrictionCodes.CATEGORY_FORBIDDEN, ex.context().get("reasonCode"));
    }

    @Test
    void rejectsYoungVehicleCash() {
        Product p = product("Truck");
        int year = java.time.Year.now(java.time.ZoneId.of("Asia/Tashkent")).getValue() - 3;
        BadRequestException ex = assertThrows(BadRequestException.class, () -> guard.assertCashAllowed(
            Sale.PaymentMethod.CASH,
            new BigDecimal("10000"),
            List.of(p),
            Map.of(p.getId(), Map.of(
                CashRestrictionCategory.ATTR_KEY, "VEHICLE_MNOG",
                CashRestrictionCategory.VEHICLE_YEAR_ATTR_KEY, String.valueOf(year)
            ))
        ));
        assertEquals(CashPaymentRestrictionCodes.VEHICLE_AGE_FORBIDDEN, ex.context().get("reasonCode"));
    }

    @Test
    void allowsOldVehicleCashWithinLimit() {
        when(operatorBrvService.cashPaymentLimitSoum()).thenReturn(new BigDecimal("25000000"));
        Product p = product("Old truck");
        int year = java.time.Year.now(java.time.ZoneId.of("Asia/Tashkent")).getValue() - 12;
        assertDoesNotThrow(() -> guard.assertCashAllowed(
            Sale.PaymentMethod.CASH,
            new BigDecimal("10000"),
            List.of(p),
            Map.of(p.getId(), Map.of(
                CashRestrictionCategory.ATTR_KEY, "VEHICLE_MNOG",
                CashRestrictionCategory.VEHICLE_YEAR_ATTR_KEY, String.valueOf(year)
            ))
        ));
    }

    @Test
    void agriculturalSkipsAmountLimit() {
        Product p = product("Wheat");
        assertDoesNotThrow(() -> guard.assertCashAllowed(
            Sale.PaymentMethod.CASH,
            new BigDecimal("999999999"),
            List.of(p),
            Map.of(p.getId(), Map.of(CashRestrictionCategory.ATTR_KEY, "AGRICULTURAL"))
        ));
    }

    @Test
    void rejectsCashOverBrvLimit() {
        when(operatorBrvService.cashPaymentLimitSoum()).thenReturn(new BigDecimal("25000000"));
        Product p = product("Phone");
        BadRequestException ex = assertThrows(BadRequestException.class, () -> guard.assertCashAllowed(
            Sale.PaymentMethod.MIXED,
            new BigDecimal("25000001"),
            List.of(p),
            Map.of(p.getId(), Map.of())
        ));
        assertEquals(CashPaymentRestrictionCodes.AMOUNT_LIMIT, ex.context().get("reasonCode"));
    }

    private static Product product(String name) {
        Product p = new Product();
        p.setId(UUID.randomUUID());
        p.setName(name);
        return p;
    }
}

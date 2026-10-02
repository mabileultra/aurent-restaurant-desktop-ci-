package com.pos.restaurant.shift.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.exception.ValidationException;
import com.pos.restaurant.shift.domain.CashOpType;
import com.pos.restaurant.shift.domain.RestaurantShiftStatus;
import com.pos.restaurant.shift.dto.CashOpRequest;
import com.pos.restaurant.shift.entity.RestaurantShift;

import java.math.BigDecimal;

public final class CashOpPolicy {

    private CashOpPolicy() {
    }

    public static String comment(CashOpRequest request) {
        if (request.type() == CashOpType.IN) {
            return blankToNull(request.comment());
        }
        String comment = blankToNull(request.comment());
        if (comment == null) {
            throw new ValidationException("Укажите причину изъятия или инкассации");
        }
        return comment;
    }

    public static void assertCanPost(RestaurantShift shift, CashOpRequest request, ShiftCashMath.Drawer drawer) {
        if (shift.getStatus() != RestaurantShiftStatus.OPEN) {
            throw new BusinessException("Кассовую операцию можно провести только в открытой смене");
        }
        if (request.type() == CashOpType.IN) {
            return;
        }
        BigDecimal expected = ShiftCashMath.expected(shift.getOpeningCash(), shift.getCashAmount(), drawer);
        if (request.amount().compareTo(expected) > 0) {
            throw new ValidationException("В кассе недостаточно наличных");
        }
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}

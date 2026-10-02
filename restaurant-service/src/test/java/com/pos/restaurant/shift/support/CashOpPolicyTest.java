package com.pos.restaurant.shift.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.exception.ValidationException;
import com.pos.restaurant.shift.domain.CashOpType;
import com.pos.restaurant.shift.domain.RestaurantShiftStatus;
import com.pos.restaurant.shift.dto.CashOpRequest;
import com.pos.restaurant.shift.entity.RestaurantShift;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CashOpPolicyTest {

    @Test
    void outAndCollectionNeedAComment() {
        assertThatThrownBy(() -> CashOpPolicy.comment(new CashOpRequest(CashOpType.OUT, new BigDecimal("10"), "  ")))
            .isInstanceOf(ValidationException.class);
        assertThat(CashOpPolicy.comment(new CashOpRequest(CashOpType.IN, new BigDecimal("10"), "  "))).isNull();
        assertThat(CashOpPolicy.comment(new CashOpRequest(CashOpType.COLLECTION, new BigDecimal("10"), "банк")))
            .isEqualTo("банк");
    }

    @Test
    void cannotTakeMoreThanTheDrawer() {
        RestaurantShift shift = RestaurantShift.builder()
            .status(RestaurantShiftStatus.OPEN)
            .openingCash(new BigDecimal("10000"))
            .cashAmount(new BigDecimal("5000"))
            .build();
        CashOpRequest out = new CashOpRequest(CashOpType.OUT, new BigDecimal("16000"), "размен");

        assertThatThrownBy(() -> CashOpPolicy.assertCanPost(shift, out, ShiftCashMath.Drawer.zero()))
            .isInstanceOf(ValidationException.class);
        CashOpPolicy.assertCanPost(shift, new CashOpRequest(CashOpType.OUT, new BigDecimal("15000"), "размен"), ShiftCashMath.Drawer.zero());
    }

    @Test
    void rejectsClosedShift() {
        RestaurantShift shift = RestaurantShift.builder()
            .status(RestaurantShiftStatus.CLOSED)
            .openingCash(BigDecimal.ZERO)
            .cashAmount(BigDecimal.ZERO)
            .build();
        assertThatThrownBy(() -> CashOpPolicy.assertCanPost(
            shift, new CashOpRequest(CashOpType.IN, new BigDecimal("1"), null), ShiftCashMath.Drawer.zero()
        )).isInstanceOf(BusinessException.class);
    }
}

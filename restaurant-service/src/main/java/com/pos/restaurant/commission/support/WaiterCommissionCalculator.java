package com.pos.restaurant.commission.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.order.domain.OrderChannel;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class WaiterCommissionCalculator {

    public BigDecimal normalizePercent(BigDecimal percent) {
        if (percent == null) {
            throw new BusinessException("Commission percent is required");
        }
        BigDecimal value = percent.setScale(2, RoundingMode.HALF_UP);
        if (value.compareTo(BigDecimal.ZERO) < 0 || value.compareTo(new BigDecimal("100.00")) > 0) {
            throw new BusinessException("Commission percent must be between 0 and 100");
        }
        return value;
    }

    public boolean applies(OrderChannel channel) {
        return channel == null || channel == OrderChannel.DINE_IN;
    }

    public BigDecimal amount(BigDecimal subtotal, BigDecimal percent) {
        BigDecimal base = subtotal == null ? BigDecimal.ZERO : subtotal;
        BigDecimal rate = percent == null ? BigDecimal.ZERO : percent;
        return base.multiply(rate)
            .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
    }
}

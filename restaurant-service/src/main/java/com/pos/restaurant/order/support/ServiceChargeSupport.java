package com.pos.restaurant.order.support;

import com.pos.restaurant.floor.entity.FloorHall;
import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.floor.support.ServicePercentRules;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.entity.FloorOrder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class ServiceChargeSupport {

    public void snapshot(FloorOrder order, BigDecimal subtotal) {
        if (!dineIn(order)) {
            order.setServicePercent(null);
            order.setServiceAmount(null);
            return;
        }
        BigDecimal percent = resolve(order.getTable());
        order.setServicePercent(percent);
        order.setServiceAmount(ServicePercentRules.amount(subtotal, percent));
    }

    /** Drop bill snapshot when the check is reopened for more items. */
    public void clearSnapshot(FloorOrder order) {
        order.setServicePercent(null);
        order.setServiceAmount(null);
    }

    /** Guest service on an already billed order. Percent stays as snapshotted. */
    public BigDecimal amountForPay(FloorOrder order, BigDecimal subtotal) {
        if (order.getServicePercent() != null) {
            BigDecimal amount = ServicePercentRules.amount(subtotal, order.getServicePercent());
            order.setServiceAmount(amount);
            return amount;
        }
        return order.getCommissionAmount() == null ? BigDecimal.ZERO : order.getCommissionAmount();
    }

    private static BigDecimal resolve(FloorTable table) {
        if (table == null) {
            return BigDecimal.ZERO.setScale(2);
        }
        if (table.getServicePercent() != null) {
            return table.getServicePercent();
        }
        FloorHall hall = table.getHall();
        if (hall != null && hall.getServicePercent() != null) {
            return hall.getServicePercent();
        }
        return BigDecimal.ZERO.setScale(2);
    }

    private static boolean dineIn(FloorOrder order) {
        return order.getChannel() == null || order.getChannel() == OrderChannel.DINE_IN;
    }
}

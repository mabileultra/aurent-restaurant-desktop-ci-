package com.pos.restaurant.order.support;

import com.pos.restaurant.menu.domain.MenuPortionUnit;
import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.menu.support.MenuPortionFormat;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** KG-priced dishes sold by grams — quantity is a fraction of the admin base weight. */
public final class WeightSaleSupport {

    private WeightSaleSupport() {}

    public static boolean isWeightSold(MenuItem item) {
        if (item == null || item.getPortionUnit() != MenuPortionUnit.KG) {
            return false;
        }
        BigDecimal amount = item.getPortionAmount();
        return amount != null && amount.signum() > 0;
    }

    /** «200 г» / «1 кг» for sold quantity (aligned with FE menuWeightNote). */
    public static String noteForQuantity(MenuItem item, BigDecimal quantity) {
        Integer refGrams = MenuPortionFormat.gramsFromAmount(item.getPortionAmount(), item.getPortionUnit());
        if (refGrams == null || quantity == null || quantity.signum() <= 0) {
            return null;
        }
        int grams = quantity.multiply(BigDecimal.valueOf(refGrams))
            .setScale(0, RoundingMode.HALF_UP)
            .intValue();
        if (grams <= 0) {
            return null;
        }
        if (grams >= 1000 && grams % 1000 == 0) {
            return (grams / 1000) + " кг";
        }
        return grams + " г";
    }

    /**
     * Kitchen slip / KDS note for the printed qty (delta), not the order line total.
     * Weight-sold lines keep total weight on the guest ticket; kitchen must see only this fire.
     */
    public static String kitchenNote(MenuItem item, String orderNote, BigDecimal printedQty) {
        if (isWeightSold(item)) {
            return noteForQuantity(item, printedQty);
        }
        return orderNote;
    }
}

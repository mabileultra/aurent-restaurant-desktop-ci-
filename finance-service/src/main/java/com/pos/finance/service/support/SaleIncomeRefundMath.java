package com.pos.finance.service.support;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class SaleIncomeRefundMath {

    private SaleIncomeRefundMath() {}

    public record Slice(UUID id, String paymentMethod, BigDecimal amount) {}

    public record Adjustment(UUID id, BigDecimal previousAmount, BigDecimal newAmount) {}

    public static List<Adjustment> reduce(List<Slice> incomes, BigDecimal cashRefund, BigDecimal cardRefund) {
        List<Adjustment> result = new ArrayList<>();
        if (incomes == null || incomes.isEmpty()) {
            return result;
        }
        BigDecimal cashLeft = scale(cashRefund);
        BigDecimal cardLeft = scale(cardRefund);
        if (cashLeft.signum() == 0 && cardLeft.signum() == 0) {
            BigDecimal only = scale(cashRefund).add(scale(cardRefund));
            if (only.signum() == 0 && incomes.size() == 1) {
                return result;
            }
        }
        for (Slice slice : incomes) {
            BigDecimal current = scale(slice.amount());
            BigDecimal take = takeFor(slice.paymentMethod(), cashLeft, cardLeft, current);
            if ("CARD".equals(method(slice.paymentMethod())) || "PAYME".equals(method(slice.paymentMethod()))
                || "CLICK".equals(method(slice.paymentMethod()))) {
                cardLeft = cardLeft.subtract(take).max(BigDecimal.ZERO);
            } else if (cashLeft.signum() > 0 || cardLeft.signum() == 0) {
                cashLeft = cashLeft.subtract(take).max(BigDecimal.ZERO);
            } else {
                cardLeft = cardLeft.subtract(take).max(BigDecimal.ZERO);
            }
            if (take.signum() > 0) {
                result.add(new Adjustment(slice.id(), current, current.subtract(take).max(BigDecimal.ZERO)));
            }
        }
        return result;
    }

    private static BigDecimal takeFor(String paymentMethod, BigDecimal cashLeft, BigDecimal cardLeft, BigDecimal current) {
        String method = method(paymentMethod);
        BigDecimal pool = switch (method) {
            case "CARD", "PAYME", "CLICK" -> cardLeft;
            case "CASH" -> cashLeft;
            default -> cashLeft.signum() > 0 ? cashLeft : cardLeft;
        };
        return current.min(pool.max(BigDecimal.ZERO));
    }

    private static String method(String paymentMethod) {
        return paymentMethod == null ? "CASH" : paymentMethod.trim().toUpperCase();
    }

    private static BigDecimal scale(BigDecimal value) {
        return (value != null ? value : BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }
}

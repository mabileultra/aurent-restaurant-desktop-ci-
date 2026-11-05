package com.pos.pharmacy.pricing.registry.exception;

import com.pos.pharmacy.exception.BusinessException;
import com.pos.pharmacy.exception.errorcode.PharmacyPriceRegistryErrors;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/** Касса: цена в чеке выше предела из госреестра. */
public class PriceLimitExceededException extends BusinessException {

    public PriceLimitExceededException(
        UUID productId,
        BigDecimal attemptedPrice,
        BigDecimal limitPrice
    ) {
        super(
            PharmacyPriceRegistryErrors.PHARM_PRICE_LIMIT_EXCEEDED,
            "Цена "
                + attemptedPrice
                + " выше предела "
                + limitPrice
                + " (госреестр розничных цен). Продажа запрещена.",
            context(productId, attemptedPrice, limitPrice)
        );
    }

    private static Map<String, Object> context(
        UUID productId,
        BigDecimal attemptedPrice,
        BigDecimal limitPrice
    ) {
        Map<String, Object> ctx = new LinkedHashMap<>();
        if (productId != null) {
            ctx.put("productId", productId.toString());
        }
        if (attemptedPrice != null) {
            ctx.put("attemptedPrice", attemptedPrice.toPlainString());
        }
        if (limitPrice != null) {
            ctx.put("limitPrice", limitPrice.toPlainString());
        }
        return ctx;
    }
}

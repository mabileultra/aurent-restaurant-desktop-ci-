package com.pos.pharmacy.sales.support;

import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacySaleErrors;
import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.pharmacy.sales.dto.CreateSaleRequest;
import com.pos.pharmacy.sales.payment.SalePaymentStrategy;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class SalePaymentResolver {

    private final Map<SaleEnums.PaymentMethod, SalePaymentStrategy> strategies;

    public SalePaymentResolver(List<SalePaymentStrategy> strategies) {
        Map<SaleEnums.PaymentMethod, SalePaymentStrategy> map = new EnumMap<>(SaleEnums.PaymentMethod.class);
        for (SalePaymentStrategy strategy : strategies) {
            for (SaleEnums.PaymentMethod method : strategy.supports()) {
                SalePaymentStrategy previous = map.put(method, strategy);
                if (previous != null) {
                    throw new IllegalStateException("Duplicate payment strategy for " + method);
                }
            }
        }
        this.strategies = Map.copyOf(map);
    }

    public PaymentAmounts resolve(SaleEnums.PaymentMethod paymentMethod, BigDecimal total, CreateSaleRequest req) {
        SalePaymentStrategy strategy = strategies.get(paymentMethod);
        if (strategy == null) {
            throw PharmacyErrors.of(
                PharmacySaleErrors.PHARM_SALE_PAYMENT_UNSUPPORTED,
                "Способ оплаты не поддерживается: " + paymentMethod
            );
        }
        return strategy.resolve(total, req);
    }

    public record PaymentAmounts(
        BigDecimal cash,
        BigDecimal card,
        BigDecimal tendered,
        BigDecimal change
    ) {}
}

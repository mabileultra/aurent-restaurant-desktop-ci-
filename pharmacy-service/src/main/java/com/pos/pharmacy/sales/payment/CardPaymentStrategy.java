package com.pos.pharmacy.sales.payment;

import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.pharmacy.sales.dto.CreateSaleRequest;
import com.pos.pharmacy.sales.support.SalePaymentResolver.PaymentAmounts;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.Set;

import static com.pos.pharmacy.sales.payment.PaymentAmountScale.scale;

@Component
class CardPaymentStrategy implements SalePaymentStrategy {

    @Override
    public Set<SaleEnums.PaymentMethod> supports() {
        return EnumSet.of(
            SaleEnums.PaymentMethod.CARD,
            SaleEnums.PaymentMethod.CASHLESS,
            SaleEnums.PaymentMethod.MPESA
        );
    }

    @Override
    public PaymentAmounts resolve(BigDecimal total, CreateSaleRequest request) {
        BigDecimal card = scale(total);
        return new PaymentAmounts(BigDecimal.ZERO, card, card, BigDecimal.ZERO);
    }
}

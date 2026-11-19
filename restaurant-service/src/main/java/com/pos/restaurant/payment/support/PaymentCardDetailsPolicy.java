package com.pos.restaurant.payment.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.payment.dto.PayOrderRequest;
import com.pos.shared.log.LogUtil;
import com.pos.shared.payment.CardDetails;
import com.pos.shared.payment.CardDetailsCheck;
import com.pos.shared.payment.CardDetailsRules;
import com.pos.shared.payment.CardDetailsViolation;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * AUR-17: реквизиты оплаты картой (категория, RRN, маска соцкарты) для оплаты заказа.
 * <p>
 * Чек пробивается до /pay, и отказ означал бы фискальный чек без оплаты. Поэтому неверное поле
 * обнуляется, остальное сохраняется, в лог идёт WARN с кодами нарушений (без значений).
 * 400 — только на полный номер соцкарты: касса его не отправляет никогда, а хранить его нельзя.
 * CASH, CASHLESS, CREDIT, ADVANCE и MIXED без доли карты — не оплата картой, реквизиты отбрасываются.
 */
@Component
public class PaymentCardDetailsPolicy {

    public CardDetails resolve(UUID orderId, PayOrderRequest request, BigDecimal cardAmount) {
        PaymentMethod method = request.method();
        boolean cardMethod = method == PaymentMethod.CARD || method == PaymentMethod.MIXED;
        boolean cardPaid = cardMethod && cardAmount != null && cardAmount.signum() > 0;
        CardDetailsCheck check = CardDetailsRules.check(
            request.cardCategory(),
            request.rrn(),
            request.socialCardNumber(),
            cardPaid
        );
        if (check.has(CardDetailsViolation.SOCIAL_NUMBER_UNMASKED)) {
            throw new BusinessException(CardDetailsViolation.SOCIAL_NUMBER_UNMASKED.message());
        }
        if (!check.ok()) {
            LogUtil.warn(
                PaymentCardDetailsPolicy.class,
                "Order payment card details partly dropped: orderId={}, method={}, violations={}",
                orderId,
                method,
                check.violations()
            );
        }
        return check.details();
    }
}

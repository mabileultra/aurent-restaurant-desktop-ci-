package com.pos.sales.service.sale.support;

import com.pos.exception.PosExceptions;
import com.pos.sales.dto.sale.CreateSaleRequest;
import com.pos.sales.entity.Sale;
import com.pos.shared.log.LogUtil;
import com.pos.shared.payment.CardDetails;
import com.pos.shared.payment.CardDetailsCheck;
import com.pos.shared.payment.CardDetailsRules;
import com.pos.shared.payment.CardDetailsViolation;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * AUR-17: проверяет реквизиты оплаты картой (категория, RRN, маска соцкарты) и записывает их в продажу.
 * <p>
 * Касса отправляет продажу уже после пробития чека в ФМ, и отказ означал бы потерю продажи.
 * Поэтому неверное поле обнуляется, остальное сохраняется, в лог идёт WARN с кодами нарушений
 * (без значений). 400 — только на полный номер соцкарты при онлайн-продаже: касса его не отправляет
 * никогда, а хранить его нельзя. Вызывается после расчёта сумм: доля карты в MIXED известна только тогда.
 */
@Component
public class SaleCardDetailsApplier {

    /** Стабильный код для фронта: CARD_DETAILS_SOCIAL_NUMBER_UNMASKED. */
    static final String REASON_CODE_PREFIX = "CARD_DETAILS_";

    /** Онлайн-продажа: полный номер соцкарты → 400, транзакция откатывается вместе со списанием. */
    public void apply(Sale sale, CreateSaleRequest req) {
        apply(sale, req, false);
    }

    /** Офлайн-синхронизация: не бросает исключений, полный номер просто отбрасывается. */
    public void applyOffline(Sale sale, CreateSaleRequest req) {
        apply(sale, req, true);
    }

    private void apply(Sale sale, CreateSaleRequest req, boolean offline) {
        CardDetailsCheck check = CardDetailsRules.check(
            req.cardCategory(),
            req.rrn(),
            req.socialCardNumber(),
            isCardPaid(sale)
        );
        if (!offline && check.has(CardDetailsViolation.SOCIAL_NUMBER_UNMASKED)) {
            CardDetailsViolation violation = CardDetailsViolation.SOCIAL_NUMBER_UNMASKED;
            throw PosExceptions.badRequest(violation.message(), Map.of(
                "reasonCode", REASON_CODE_PREFIX + violation.name(),
                "field", violation.field()
            ));
        }
        if (!check.ok()) {
            LogUtil.warn(
                SaleCardDetailsApplier.class,
                "Sale card details partly dropped: receipt={}, clientSaleId={}, violations={}",
                sale.getReceiptNumber(),
                sale.getClientSaleId(),
                check.violations()
            );
        }
        write(sale, check.details());
    }

    /** CARD или MIXED с долей карты больше нуля; чек-кредит картой не оплачен. */
    private static boolean isCardPaid(Sale sale) {
        Sale.PaymentMethod method = sale.getPaymentMethod();
        boolean cardMethod = method == Sale.PaymentMethod.CARD || method == Sale.PaymentMethod.MIXED;
        return cardMethod
            && sale.getReceiptType() != Sale.ReceiptType.CREDIT
            && sale.getCardAmount() != null
            && sale.getCardAmount().signum() > 0;
    }

    private static void write(Sale sale, CardDetails details) {
        sale.setCardCategory(details.category());
        sale.setRrn(details.rrn());
        sale.setSocialCardNumber(details.socialCardNumber());
    }
}

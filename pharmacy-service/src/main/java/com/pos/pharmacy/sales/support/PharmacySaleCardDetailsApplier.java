package com.pos.pharmacy.sales.support;

import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacySaleErrors;
import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.pharmacy.sales.dto.CreateSaleRequest;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.shared.log.LogUtil;
import com.pos.shared.payment.CardDetailsCheck;
import com.pos.shared.payment.CardDetailsRules;
import com.pos.shared.payment.CardDetailsViolation;
import org.springframework.stereotype.Component;

/**
 * AUR-17: проверяет реквизиты оплаты картой (категория, RRN, маска соцкарты) и записывает их в продажу.
 * <p>
 * Касса отправляет продажу уже после пробития чека в ФМ, и отказ означал бы потерю продажи.
 * Поэтому неверное поле обнуляется, остальное сохраняется, в лог идёт WARN с кодами нарушений
 * (без значений). 400 — только на полный номер соцкарты при онлайн-продаже: касса его не отправляет
 * никогда, а хранить его нельзя. Вызывается после расчёта сумм: доля карты в MIXED известна только тогда.
 */
@Component
public class PharmacySaleCardDetailsApplier {

    public void apply(Sale sale, CreateSaleRequest req, boolean offline) {
        CardDetailsCheck check = CardDetailsRules.check(
            req.cardCategory(),
            req.rrn(),
            req.socialCardNumber(),
            isCardPaid(sale)
        );
        if (!offline && check.has(CardDetailsViolation.SOCIAL_NUMBER_UNMASKED)) {
            throw PharmacyErrors.of(
                PharmacySaleErrors.PHARM_SALE_CARD_SOCIAL_NUMBER_UNMASKED,
                "field",
                CardDetailsViolation.SOCIAL_NUMBER_UNMASKED.field()
            );
        }
        if (!check.ok()) {
            LogUtil.warn(
                PharmacySaleCardDetailsApplier.class,
                "Pharmacy sale card details partly dropped: receipt={}, clientSaleId={}, violations={}",
                sale.getReceiptNumber(),
                sale.getClientSaleId(),
                check.violations()
            );
        }
        sale.setCardCategory(check.details().category());
        sale.setRrn(check.details().rrn());
        sale.setSocialCardNumber(check.details().socialCardNumber());
    }

    private static boolean isCardPaid(Sale sale) {
        SaleEnums.PaymentMethod method = sale.getPaymentMethod();
        boolean cardMethod = method == SaleEnums.PaymentMethod.CARD || method == SaleEnums.PaymentMethod.MIXED;
        return cardMethod && sale.getCardAmount() != null && sale.getCardAmount().signum() > 0;
    }
}

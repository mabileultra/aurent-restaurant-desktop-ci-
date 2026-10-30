package com.pos.platform.service.support.payme;

import com.pos.platform.domain.BillingPaymentProvider;
import com.pos.platform.entity.BillingPaymentIntent;
import com.pos.platform.repository.BillingPaymentIntentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PaymeIntentLookup {

    private final BillingPaymentIntentRepository intentRepository;

    public BillingPaymentIntent resolveFromAccount(Map<String, Object> params) {
        Object accountObj = params.get("account");
        if (!(accountObj instanceof Map<?, ?> account)) {
            return null;
        }
        Object orderId = account.get("order_id");
        if (orderId == null) {
            orderId = account.get("orderId");
        }
        UUID id = PaymeParamCodec.parseUuid(String.valueOf(orderId));
        if (id == null) {
            return null;
        }
        return intentRepository.findById(id)
            .filter(i -> i.getProvider() == BillingPaymentProvider.PAYME)
            .orElse(null);
    }

    public BillingPaymentIntent findByPaymeId(String paymeId) {
        return intentRepository
            .findByProviderAndProviderTransId(BillingPaymentProvider.PAYME, paymeId)
            .orElseGet(() -> {
                UUID maybe = PaymeParamCodec.parseUuid(paymeId);
                return maybe == null ? null : intentRepository.findById(maybe).orElse(null);
            });
    }
}

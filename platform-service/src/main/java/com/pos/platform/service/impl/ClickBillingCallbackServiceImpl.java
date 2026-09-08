package com.pos.platform.service.impl;

import com.pos.platform.domain.BillingPaymentProvider;
import com.pos.platform.domain.BillingPaymentStatus;
import com.pos.platform.entity.BillingPaymentIntent;
import com.pos.platform.repository.BillingPaymentIntentRepository;
import com.pos.platform.service.BillingPaymentCreditService;
import com.pos.platform.service.ClickBillingCallbackService;
import com.pos.platform.service.support.BillingPaymentAuth;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClickBillingCallbackServiceImpl implements ClickBillingCallbackService {

    private final BillingPaymentIntentRepository intentRepository;
    private final BillingPaymentCreditService creditService;
    private final BillingPaymentAuth auth;

    @Override
    @Transactional
    public Map<String, Object> prepare(Map<String, String> params) {
        if (!auth.clickConfigured()) {
            return error(params, -9, "Click disabled");
        }
        if (!auth.verifyClickSign(params, false)) {
            return error(params, -1, "Invalid sign");
        }
        BillingPaymentIntent intent = findClickIntent(params.get("merchant_trans_id"));
        if (intent == null) {
            return error(params, -5, "Order not found");
        }
        if (intent.getStatus() == BillingPaymentStatus.PAID) {
            return error(params, -4, "Already paid");
        }
        BigDecimal amount = parseDecimal(params.get("amount"));
        if (amount == null || amount.compareTo(intent.getAmount()) != 0) {
            return error(params, -2, "Incorrect amount");
        }

        intent.setStatus(BillingPaymentStatus.PREPARED);
        intent.setProviderTransId(params.get("click_trans_id"));
        intent.setProviderPrepareId(String.valueOf(Math.abs(intent.getId().getMostSignificantBits() % 1_000_000_000L)));
        intentRepository.save(intent);

        Map<String, Object> ok = base(params, intent);
        ok.put("merchant_prepare_id", Integer.parseInt(intent.getProviderPrepareId()));
        ok.put("error", 0);
        ok.put("error_note", "Success");
        return ok;
    }

    @Override
    @Transactional
    public Map<String, Object> complete(Map<String, String> params) {
        if (!auth.clickConfigured()) {
            return error(params, -9, "Click disabled");
        }
        if (!auth.verifyClickSign(params, true)) {
            return error(params, -1, "Invalid sign");
        }

        BillingPaymentIntent intent = findClickIntent(params.get("merchant_trans_id"));
        if (intent == null) {
            return error(params, -5, "Order not found");
        }

        int errorCode = parseInt(params.get("error"), 0);
        if (errorCode < 0) {
            intent.setStatus(BillingPaymentStatus.CANCELLED);
            intent.setErrorNote(params.get("error_note"));
            intentRepository.save(intent);
            Map<String, Object> ok = base(params, intent);
            ok.put("merchant_confirm_id", intent.getProviderPrepareId());
            ok.put("error", -9);
            ok.put("error_note", "Transaction cancelled");
            return ok;
        }

        if (intent.getStatus() == BillingPaymentStatus.PAID) {
            Map<String, Object> ok = base(params, intent);
            ok.put("merchant_confirm_id", intent.getProviderPrepareId());
            ok.put("error", -4);
            ok.put("error_note", "Already paid");
            return ok;
        }

        BigDecimal amount = parseDecimal(params.get("amount"));
        if (amount == null || amount.compareTo(intent.getAmount()) != 0) {
            return error(params, -2, "Incorrect amount");
        }

        creditService.markPaid(intent, params.get("click_trans_id"), "Пополнение через Click");
        Map<String, Object> ok = base(params, intent);
        ok.put("merchant_confirm_id", intent.getProviderPrepareId());
        ok.put("error", 0);
        ok.put("error_note", "Success");
        return ok;
    }

    private BillingPaymentIntent findClickIntent(String merchantTransId) {
        UUID id = parseUuid(merchantTransId);
        if (id == null) {
            return null;
        }
        return intentRepository.findById(id)
            .filter(i -> i.getProvider() == BillingPaymentProvider.CLICK)
            .orElse(null);
    }

    private static Map<String, Object> base(Map<String, String> params, BillingPaymentIntent intent) {
        Map<String, Object> ok = new LinkedHashMap<>();
        ok.put("click_trans_id", params.get("click_trans_id"));
        ok.put("merchant_trans_id", intent.getId().toString());
        return ok;
    }

    private static Map<String, Object> error(Map<String, String> params, int code, String note) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("click_trans_id", params.get("click_trans_id"));
        m.put("merchant_trans_id", params.get("merchant_trans_id"));
        m.put("error", code);
        m.put("error_note", note);
        return m;
    }

    private static UUID parseUuid(String raw) {
        if (raw == null || raw.isBlank() || "null".equals(raw)) {
            return null;
        }
        try {
            return UUID.fromString(raw.trim());
        } catch (Exception e) {
            return null;
        }
    }

    private static BigDecimal parseDecimal(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return new BigDecimal(raw.trim()).setScale(2, RoundingMode.HALF_UP);
        } catch (Exception e) {
            return null;
        }
    }

    private static int parseInt(String raw, int def) {
        try {
            return Integer.parseInt(raw);
        } catch (Exception e) {
            return def;
        }
    }
}

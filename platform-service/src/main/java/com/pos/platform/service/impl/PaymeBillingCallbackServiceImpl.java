package com.pos.platform.service.impl;

import com.pos.platform.domain.BillingPaymentProvider;
import com.pos.platform.domain.BillingPaymentStatus;
import com.pos.platform.entity.BillingPaymentIntent;
import com.pos.platform.repository.BillingPaymentIntentRepository;
import com.pos.platform.service.BillingPaymentCreditService;
import com.pos.platform.service.PaymeBillingCallbackService;
import com.pos.platform.service.support.BillingPaymentAuth;
import com.pos.platform.service.support.BillingPaymentUrlBuilder;
import com.pos.platform.service.support.payme.PaymeFiscalDetailBuilder;
import com.pos.platform.service.support.payme.PaymeIntentLookup;
import com.pos.platform.service.support.payme.PaymeJsonRpc;
import com.pos.platform.service.support.payme.PaymeParamCodec;
import com.pos.platform.service.support.payme.PaymeTransactionSnapshot;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymeBillingCallbackServiceImpl implements PaymeBillingCallbackService {

    private final BillingPaymentIntentRepository intentRepository;
    private final BillingPaymentCreditService creditService;
    private final BillingPaymentAuth auth;
    private final PaymeIntentLookup intentLookup;
    private final PaymeFiscalDetailBuilder fiscalDetailBuilder;

    @Override
    @Transactional
    public Object handle(Map<String, Object> body, String authHeader) {
        if (!auth.paymeConfigured()) {
            return PaymeJsonRpc.error(body != null ? body.get("id") : null, -32400, "Payme disabled");
        }
        if (!auth.verifyPaymeAuth(authHeader)) {
            return PaymeJsonRpc.error(body != null ? body.get("id") : null, -32504, "Insufficient privilege");
        }

        String method = String.valueOf(body.get("method"));
        Object id = body.get("id");
        @SuppressWarnings("unchecked")
        Map<String, Object> params = body.get("params") instanceof Map<?, ?> m
            ? (Map<String, Object>) m
            : Map.of();

        return switch (method) {
            case "CheckPerformTransaction" -> checkPerform(id, params);
            case "CreateTransaction" -> create(id, params);
            case "PerformTransaction" -> perform(id, params);
            case "CancelTransaction" -> cancel(id, params);
            case "CheckTransaction" -> check(id, params);
            case "GetStatement" -> getStatement(id, params);
            default -> PaymeJsonRpc.error(id, -32601, "Method not found");
        };
    }

    private Map<String, Object> checkPerform(Object id, Map<String, Object> params) {
        BillingPaymentIntent intent = intentLookup.resolveFromAccount(params);
        if (intent == null) {
            return PaymeJsonRpc.error(id, -31050, "Order not found");
        }
        Long amountTiyin = PaymeParamCodec.requirePositiveTiyin(params.get("amount"));
        if (amountTiyin == null) {
            return PaymeJsonRpc.error(id, -31001, "Invalid amount");
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("allow", true);
        result.put("detail", fiscalDetailBuilder.build(amountTiyin));
        return PaymeJsonRpc.ok(id, result);
    }

    private Map<String, Object> create(Object id, Map<String, Object> params) {
        BillingPaymentIntent intent = intentLookup.resolveFromAccount(params);
        if (intent == null) {
            return PaymeJsonRpc.error(id, -31050, "Order not found");
        }
        Long amountTiyin = PaymeParamCodec.requirePositiveTiyin(params.get("amount"));
        if (amountTiyin == null) {
            return PaymeJsonRpc.error(id, -31001, "Invalid amount");
        }
        String paymeId = PaymeParamCodec.paymeId(params);
        if (paymeId == null) {
            return PaymeJsonRpc.error(id, -32602, "Invalid params");
        }

        BillingPaymentIntent existingByPaymeId = intentLookup.findByPaymeId(paymeId);
        if (existingByPaymeId != null) {
            return createdResult(id, existingByPaymeId);
        }
        if (intent.getStatus() == BillingPaymentStatus.PREPARED
            && StringUtils.hasText(intent.getProviderTransId())) {
            return createdResult(id, intent);
        }

        long createTimeMs = PaymeTransactionSnapshot.resolveIncomingCreateTime(params);
        intent.setAmount(PaymeParamCodec.fromTiyin(amountTiyin));
        intent.setProviderTransId(paymeId);
        intent.setStatus(BillingPaymentStatus.PREPARED);
        intent.setPaidAt(null);
        intent.setErrorNote(null);
        intent.setPaymeCancelReason(null);
        intent.setPaymeCancelledAt(null);
        intent.setProviderPrepareId(String.valueOf(createTimeMs));
        intentRepository.save(intent);
        return createdResult(id, intent);
    }

    private Map<String, Object> perform(Object id, Map<String, Object> params) {
        String paymeId = PaymeParamCodec.paymeId(params);
        if (paymeId == null) {
            return PaymeJsonRpc.error(id, -32602, "Invalid params");
        }
        BillingPaymentIntent intent = intentLookup.findByPaymeId(paymeId);
        if (intent == null) {
            return PaymeJsonRpc.error(id, -31003, "Transaction not found");
        }
        if (intent.getStatus() == BillingPaymentStatus.PAID) {
            return performResult(id, intent);
        }
        if (intent.getStatus() == BillingPaymentStatus.CANCELLED
            || intent.getStatus() == BillingPaymentStatus.FAILED) {
            return PaymeJsonRpc.error(id, -31008, "Transaction cancelled");
        }
        creditService.markPaid(intent, paymeId, "Пополнение через Payme");
        BillingPaymentIntent paid = intentRepository.findById(intent.getId()).orElse(intent);
        return performResult(id, paid);
    }

    private Map<String, Object> performResult(Object id, BillingPaymentIntent intent) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("transaction", intent.getId().toString());
        result.put(
            "perform_time",
            intent.getPaidAt() != null ? intent.getPaidAt().toEpochMilli() : Instant.now().toEpochMilli()
        );
        result.put("state", PaymeTransactionSnapshot.STATE_DONE);
        return PaymeJsonRpc.ok(id, result);
    }

    private Map<String, Object> cancel(Object id, Map<String, Object> params) {
        String paymeId = PaymeParamCodec.paymeId(params);
        if (paymeId == null) {
            return PaymeJsonRpc.error(id, -32602, "Invalid params");
        }
        BillingPaymentIntent intent = intentLookup.findByPaymeId(paymeId);
        if (intent == null) {
            return PaymeJsonRpc.error(id, -31003, "Transaction not found");
        }
        if (intent.getStatus() == BillingPaymentStatus.CANCELLED
            || intent.getStatus() == BillingPaymentStatus.FAILED) {
            return cancelResult(id, intent);
        }

        boolean afterPerform = intent.getStatus() == BillingPaymentStatus.PAID;
        int reason = PaymeTransactionSnapshot.resolveCancelReason(params, afterPerform);
        Instant cancelAt = Instant.now();

        if (afterPerform) {
            creditService.reversePaid(intent, "Payme CancelTransaction after Perform");
            intent = intentRepository.findById(intent.getId()).orElse(intent);
        } else if (intent.getStatus() == BillingPaymentStatus.PREPARED) {
            intent.setStatus(BillingPaymentStatus.CANCELLED);
        } else {
            return PaymeJsonRpc.error(id, -31008, "Transaction cancelled");
        }

        intent.setPaymeCancelReason(reason);
        intent.setPaymeCancelledAt(cancelAt);
        intentRepository.save(intent);
        return cancelResult(id, intent);
    }

    private Map<String, Object> cancelResult(Object id, BillingPaymentIntent intent) {
        PaymeTransactionSnapshot snap = PaymeTransactionSnapshot.of(intent);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("transaction", intent.getId().toString());
        result.put("cancel_time", snap.cancelTimeMs());
        result.put("state", snap.state());
        return PaymeJsonRpc.ok(id, result);
    }

    private Map<String, Object> check(Object id, Map<String, Object> params) {
        String paymeId = PaymeParamCodec.paymeId(params);
        if (paymeId == null) {
            return PaymeJsonRpc.error(id, -32602, "Invalid params");
        }
        BillingPaymentIntent intent = intentLookup.findByPaymeId(paymeId);
        if (intent == null) {
            return PaymeJsonRpc.error(id, -31003, "Transaction not found");
        }
        PaymeTransactionSnapshot snap = PaymeTransactionSnapshot.of(intent);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("create_time", snap.createTimeMs());
        result.put("perform_time", snap.performTimeMs());
        result.put("cancel_time", snap.cancelTimeMs());
        result.put("transaction", intent.getId().toString());
        result.put("state", snap.state());
        result.put("reason", snap.reason());
        return PaymeJsonRpc.ok(id, result);
    }

    private Map<String, Object> getStatement(Object id, Map<String, Object> params) {
        Instant from = PaymeParamCodec.millisToInstant(params.get("from"));
        Instant to = PaymeParamCodec.millisToInstant(params.get("to"));
        if (from == null || to == null) {
            return PaymeJsonRpc.error(id, -31050, "Invalid period");
        }
        List<BillingPaymentIntent> rows = intentRepository.findPaymeStatement(
            BillingPaymentProvider.PAYME.name(),
            from.toEpochMilli(),
            to.toEpochMilli()
        );
        List<Map<String, Object>> transactions = new ArrayList<>();
        for (BillingPaymentIntent intent : rows) {
            if (!StringUtils.hasText(intent.getProviderTransId())) {
                continue;
            }
            PaymeTransactionSnapshot snap = PaymeTransactionSnapshot.of(intent);
            long createTimeMs = snap.createTimeMs();
            if (createTimeMs < from.toEpochMilli() || createTimeMs > to.toEpochMilli()) {
                continue;
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", intent.getProviderTransId());
            row.put("time", createTimeMs);
            row.put("amount", BillingPaymentUrlBuilder.toTiyin(intent.getAmount()));
            row.put("account", Map.of("order_id", intent.getId().toString()));
            row.put("create_time", createTimeMs);
            row.put("perform_time", snap.performTimeMs());
            row.put("cancel_time", snap.cancelTimeMs());
            row.put("transaction", intent.getId().toString());
            row.put("state", snap.state());
            row.put("reason", snap.reason());
            transactions.add(row);
        }
        transactions.sort(Comparator.comparingLong(r -> ((Number) r.get("time")).longValue()));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("transactions", transactions);
        return PaymeJsonRpc.ok(id, result);
    }

    private Map<String, Object> createdResult(Object id, BillingPaymentIntent intent) {
        PaymeTransactionSnapshot snap = PaymeTransactionSnapshot.of(intent);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("create_time", snap.createTimeMs());
        result.put("transaction", intent.getId().toString());
        result.put("state", snap.state());
        if (snap.state() == PaymeTransactionSnapshot.STATE_DONE && snap.performTimeMs() > 0) {
            result.put("perform_time", snap.performTimeMs());
        }
        return PaymeJsonRpc.ok(id, result);
    }
}

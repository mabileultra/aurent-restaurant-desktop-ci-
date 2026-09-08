package com.pos.platform.service.impl;

import com.pos.platform.domain.BillingPaymentProvider;
import com.pos.platform.domain.BillingPaymentStatus;
import com.pos.platform.entity.BillingPaymentIntent;
import com.pos.platform.repository.BillingPaymentIntentRepository;
import com.pos.platform.service.BillingPaymentCreditService;
import com.pos.platform.service.PaymeBillingCallbackService;
import com.pos.platform.service.support.BillingPaymentAuth;
import com.pos.platform.service.support.BillingPaymentUrlBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymeBillingCallbackServiceImpl implements PaymeBillingCallbackService {

    private static final int STATE_CREATED = 1;
    private static final int STATE_DONE = 2;
    private static final int STATE_CANCELLED = -1;
    private static final int STATE_CANCELLED_AFTER = -2;

    private final BillingPaymentIntentRepository intentRepository;
    private final BillingPaymentCreditService creditService;
    private final BillingPaymentAuth auth;

    @Override
    @Transactional
    public Object handle(Map<String, Object> body, String authHeader) {
        if (!auth.paymeConfigured()) {
            return error(body != null ? body.get("id") : null, -32400, "Payme disabled");
        }
        if (!auth.verifyPaymeAuth(authHeader)) {
            return error(body != null ? body.get("id") : null, -32504, "Insufficient privilege");
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
            case "GetStatement" -> Map.of("jsonrpc", "2.0", "id", id, "result", Map.of("transactions", List.of()));
            default -> error(id, -32601, "Method not found");
        };
    }

    private Map<String, Object> checkPerform(Object id, Map<String, Object> params) {
        BillingPaymentIntent intent = resolveIntent(params);
        if (intent == null) {
            return error(id, -31050, "Order not found");
        }
        if (intent.getStatus() == BillingPaymentStatus.PAID) {
            return error(id, -31051, "Already paid");
        }
        BigDecimal amountTiyin = toDecimal(params.get("amount"));
        if (amountTiyin == null || amountTiyin.longValue() != BillingPaymentUrlBuilder.toTiyin(intent.getAmount())) {
            return error(id, -31001, "Invalid amount");
        }
        return Map.of("jsonrpc", "2.0", "id", id, "result", Map.of("allow", true));
    }

    private Map<String, Object> create(Object id, Map<String, Object> params) {
        BillingPaymentIntent intent = resolveIntent(params);
        if (intent == null) {
            return error(id, -31050, "Order not found");
        }
        BigDecimal amountTiyin = toDecimal(params.get("amount"));
        if (amountTiyin == null || amountTiyin.longValue() != BillingPaymentUrlBuilder.toTiyin(intent.getAmount())) {
            return error(id, -31001, "Invalid amount");
        }
        if (intent.getStatus() == BillingPaymentStatus.PAID) {
            return error(id, -31051, "Already paid");
        }
        String paymeId = String.valueOf(params.get("id"));
        intent.setProviderTransId(paymeId);
        intent.setStatus(BillingPaymentStatus.PREPARED);
        intent.setProviderPrepareId(String.valueOf(intent.getCreatedAt().toEpochMilli()));
        intentRepository.save(intent);
        return Map.of(
            "jsonrpc", "2.0",
            "id", id,
            "result", Map.of(
                "create_time", intent.getCreatedAt().toEpochMilli(),
                "transaction", intent.getId().toString(),
                "state", STATE_CREATED
            )
        );
    }

    private Map<String, Object> perform(Object id, Map<String, Object> params) {
        String paymeId = String.valueOf(params.get("id"));
        BillingPaymentIntent intent = intentRepository
            .findByProviderAndProviderTransId(BillingPaymentProvider.PAYME, paymeId)
            .orElseGet(() -> {
                UUID maybe = parseUuid(paymeId);
                return maybe == null ? null : intentRepository.findById(maybe).orElse(null);
            });
        if (intent == null) {
            return error(id, -31003, "Transaction not found");
        }
        if (intent.getStatus() == BillingPaymentStatus.PAID) {
            return Map.of(
                "jsonrpc", "2.0",
                "id", id,
                "result", Map.of(
                    "transaction", intent.getId().toString(),
                    "perform_time", intent.getPaidAt() != null ? intent.getPaidAt().toEpochMilli() : Instant.now().toEpochMilli(),
                    "state", STATE_DONE
                )
            );
        }
        creditService.markPaid(intent, paymeId, "Пополнение через Payme");
        return Map.of(
            "jsonrpc", "2.0",
            "id", id,
            "result", Map.of(
                "transaction", intent.getId().toString(),
                "perform_time", intent.getPaidAt().toEpochMilli(),
                "state", STATE_DONE
            )
        );
    }

    private Map<String, Object> cancel(Object id, Map<String, Object> params) {
        String paymeId = String.valueOf(params.get("id"));
        BillingPaymentIntent intent = intentRepository
            .findByProviderAndProviderTransId(BillingPaymentProvider.PAYME, paymeId)
            .orElse(null);
        if (intent == null) {
            return error(id, -31003, "Transaction not found");
        }
        boolean afterPay = intent.getStatus() == BillingPaymentStatus.PAID;
        intent.setStatus(BillingPaymentStatus.CANCELLED);
        intent.setErrorNote(afterPay ? "Cancelled after pay (manual review)" : null);
        intentRepository.save(intent);
        return Map.of(
            "jsonrpc", "2.0",
            "id", id,
            "result", Map.of(
                "transaction", intent.getId().toString(),
                "cancel_time", Instant.now().toEpochMilli(),
                "state", afterPay ? STATE_CANCELLED_AFTER : STATE_CANCELLED
            )
        );
    }

    private Map<String, Object> check(Object id, Map<String, Object> params) {
        String paymeId = String.valueOf(params.get("id"));
        BillingPaymentIntent intent = intentRepository
            .findByProviderAndProviderTransId(BillingPaymentProvider.PAYME, paymeId)
            .orElse(null);
        if (intent == null) {
            return error(id, -31003, "Transaction not found");
        }
        int state = switch (intent.getStatus()) {
            case PAID -> STATE_DONE;
            case CANCELLED, FAILED -> STATE_CANCELLED;
            default -> STATE_CREATED;
        };
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("create_time", intent.getCreatedAt().toEpochMilli());
        result.put("perform_time", intent.getPaidAt() != null ? intent.getPaidAt().toEpochMilli() : 0);
        result.put("cancel_time", intent.getStatus() == BillingPaymentStatus.CANCELLED ? intent.getUpdatedAt().toEpochMilli() : 0);
        result.put("transaction", intent.getId().toString());
        result.put("state", state);
        result.put("reason", null);
        return Map.of("jsonrpc", "2.0", "id", id, "result", result);
    }

    private BillingPaymentIntent resolveIntent(Map<String, Object> params) {
        Object accountObj = params.get("account");
        if (!(accountObj instanceof Map<?, ?> account)) {
            return null;
        }
        Object orderId = account.get("order_id");
        if (orderId == null) {
            orderId = account.get("orderId");
        }
        UUID id = parseUuid(String.valueOf(orderId));
        if (id == null) {
            return null;
        }
        return intentRepository.findById(id)
            .filter(i -> i.getProvider() == BillingPaymentProvider.PAYME)
            .orElse(null);
    }

    private static Map<String, Object> error(Object id, int code, String message) {
        Map<String, Object> error = new LinkedHashMap<>();
        error.put("code", code);
        error.put("message", Map.of("ru", message, "uz", message, "en", message));
        error.put("data", null);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("jsonrpc", "2.0");
        resp.put("id", id);
        resp.put("error", error);
        return resp;
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

    private static BigDecimal toDecimal(Object raw) {
        if (raw == null) {
            return null;
        }
        try {
            return new BigDecimal(String.valueOf(raw));
        } catch (Exception e) {
            return null;
        }
    }
}

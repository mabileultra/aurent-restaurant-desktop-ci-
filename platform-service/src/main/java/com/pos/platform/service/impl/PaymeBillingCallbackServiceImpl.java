package com.pos.platform.service.impl;

import com.pos.platform.config.BillingPaymentProperties;
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
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
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
    private final BillingPaymentProperties paymentProperties;

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
            case "GetStatement" -> getStatement(id, params);
            default -> error(id, -32601, "Method not found");
        };
    }

    private Map<String, Object> checkPerform(Object id, Map<String, Object> params) {
        BillingPaymentIntent intent = resolveIntent(params);
        if (intent == null) {
            return error(id, -31050, "Order not found");
        }
        // Balance top-up: amount is free — client may pay any positive sum for the same order_id.
        Long amountTiyin = requirePositiveTiyin(params.get("amount"));
        if (amountTiyin == null) {
            return error(id, -31001, "Invalid amount");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("allow", true);
        result.put("detail", buildFiscalDetail(amountTiyin));
        return ok(id, result);
    }

    private Map<String, Object> buildFiscalDetail(long amountTiyin) {
        BillingPaymentProperties.Payme payme = paymentProperties.getPayme();
        String title = StringUtils.hasText(payme.getReceiptTitle())
            ? payme.getReceiptTitle().trim()
            : "Пополнение баланса Aurent";
        String ikpu = StringUtils.hasText(payme.getIkpu()) ? payme.getIkpu().trim() : "10305008003000000";
        String packageCode = StringUtils.hasText(payme.getPackageCode())
            ? payme.getPackageCode().trim()
            : "1546532";
        int vat = payme.getVatPercent();

        Map<String, Object> item = new LinkedHashMap<>();
        item.put("title", title);
        item.put("price", amountTiyin);
        item.put("count", 1);
        item.put("code", ikpu);
        item.put("package_code", packageCode);
        item.put("vat_percent", vat);

        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("receipt_type", 0);
        detail.put("items", List.of(item));
        return detail;
    }

    private Map<String, Object> create(Object id, Map<String, Object> params) {
        BillingPaymentIntent intent = resolveIntent(params);
        if (intent == null) {
            return error(id, -31050, "Order not found");
        }
        Long amountTiyin = requirePositiveTiyin(params.get("amount"));
        if (amountTiyin == null) {
            return error(id, -31001, "Invalid amount");
        }
        String paymeId = paymeId(params);
        if (paymeId == null) {
            return error(id, -32602, "Invalid params");
        }

        BillingPaymentIntent existingByPaymeId = findByPaymeId(paymeId);
        if (existingByPaymeId != null) {
            return createdResult(id, existingByPaymeId);
        }
        if (intent.getStatus() == BillingPaymentStatus.PREPARED
            && StringUtils.hasText(intent.getProviderTransId())) {
            // Keep the first Payme id for this order — sandbox may retry Create with another id,
            // but PerformTransaction still uses the original id (state=1 created).
            return createdResult(id, intent);
        }

        // New attempt: store Payme params.time as create_time (not order.created_at).
        long createTimeMs = resolveIncomingCreateTime(params);
        intent.setAmount(fromTiyin(amountTiyin));
        intent.setProviderTransId(paymeId);
        intent.setStatus(BillingPaymentStatus.PREPARED);
        intent.setPaidAt(null);
        intent.setErrorNote(null);
        intent.setProviderPrepareId(String.valueOf(createTimeMs));
        intentRepository.save(intent);
        return createdResult(id, intent);
    }

    private Map<String, Object> perform(Object id, Map<String, Object> params) {
        String paymeId = paymeId(params);
        if (paymeId == null) {
            return error(id, -32602, "Invalid params");
        }
        BillingPaymentIntent intent = findByPaymeId(paymeId);
        if (intent == null) {
            return error(id, -31003, "Transaction not found");
        }
        if (intent.getStatus() == BillingPaymentStatus.PAID) {
            return ok(id, Map.of(
                "transaction", intent.getId().toString(),
                "perform_time", intent.getPaidAt() != null
                    ? intent.getPaidAt().toEpochMilli()
                    : Instant.now().toEpochMilli(),
                "state", STATE_DONE
            ));
        }
        if (intent.getStatus() == BillingPaymentStatus.CANCELLED
            || intent.getStatus() == BillingPaymentStatus.FAILED) {
            return error(id, -31008, "Transaction cancelled");
        }
        creditService.markPaid(intent, paymeId, "Пополнение через Payme");
        BillingPaymentIntent paid = intentRepository.findById(intent.getId()).orElse(intent);
        return ok(id, Map.of(
            "transaction", paid.getId().toString(),
            "perform_time", paid.getPaidAt() != null
                ? paid.getPaidAt().toEpochMilli()
                : Instant.now().toEpochMilli(),
            "state", STATE_DONE
        ));
    }

    private Map<String, Object> cancel(Object id, Map<String, Object> params) {
        String paymeId = paymeId(params);
        if (paymeId == null) {
            return error(id, -32602, "Invalid params");
        }
        BillingPaymentIntent intent = findByPaymeId(paymeId);
        if (intent == null) {
            return error(id, -31003, "Transaction not found");
        }
        boolean afterPay = intent.getStatus() == BillingPaymentStatus.PAID;
        if (afterPay) {
            creditService.reversePaid(intent, "Payme CancelTransaction after Perform");
        } else {
            intent.setStatus(BillingPaymentStatus.CANCELLED);
            intentRepository.save(intent);
        }
        Instant cancelAt = Instant.now();
        return ok(id, Map.of(
            "transaction", intent.getId().toString(),
            "cancel_time", cancelAt.toEpochMilli(),
            "state", afterPay ? STATE_CANCELLED_AFTER : STATE_CANCELLED
        ));
    }

    private Map<String, Object> check(Object id, Map<String, Object> params) {
        String paymeId = paymeId(params);
        if (paymeId == null) {
            return error(id, -32602, "Invalid params");
        }
        BillingPaymentIntent intent = findByPaymeId(paymeId);
        if (intent == null) {
            return error(id, -31003, "Transaction not found");
        }
        int state = switch (intent.getStatus()) {
            case PAID -> STATE_DONE;
            case CANCELLED -> intent.getPaidAt() != null ? STATE_CANCELLED_AFTER : STATE_CANCELLED;
            case FAILED -> STATE_CANCELLED;
            default -> STATE_CREATED;
        };
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("create_time", resolveStoredCreateTime(intent));
        result.put("perform_time", intent.getPaidAt() != null ? intent.getPaidAt().toEpochMilli() : 0L);
        result.put(
            "cancel_time",
            intent.getStatus() == BillingPaymentStatus.CANCELLED ? intent.getUpdatedAt().toEpochMilli() : 0L
        );
        result.put("transaction", intent.getId().toString());
        result.put("state", state);
        result.put("reason", null);
        return ok(id, result);
    }

    private Map<String, Object> getStatement(Object id, Map<String, Object> params) {
        Instant from = millisToInstant(params.get("from"));
        Instant to = millisToInstant(params.get("to"));
        if (from == null || to == null) {
            return error(id, -31050, "Invalid period");
        }
        List<BillingPaymentIntent> rows = intentRepository.findPaymeStatement(
            BillingPaymentProvider.PAYME,
            from,
            to
        );
        List<Map<String, Object>> transactions = new ArrayList<>();
        for (BillingPaymentIntent intent : rows) {
            if (intent.getProviderTransId() == null || intent.getProviderTransId().isBlank()) {
                continue;
            }
            int state = switch (intent.getStatus()) {
                case PAID -> STATE_DONE;
                case CANCELLED -> intent.getPaidAt() != null ? STATE_CANCELLED_AFTER : STATE_CANCELLED;
                case FAILED -> STATE_CANCELLED;
                default -> STATE_CREATED;
            };
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", intent.getProviderTransId());
            long createTimeMs = resolveStoredCreateTime(intent);
            row.put("time", createTimeMs);
            row.put("amount", BillingPaymentUrlBuilder.toTiyin(intent.getAmount()));
            row.put("account", Map.of("order_id", intent.getId().toString()));
            row.put("create_time", createTimeMs);
            row.put("perform_time", intent.getPaidAt() != null ? intent.getPaidAt().toEpochMilli() : 0L);
            row.put(
                "cancel_time",
                intent.getStatus() == BillingPaymentStatus.CANCELLED
                    ? intent.getUpdatedAt().toEpochMilli()
                    : 0L
            );
            row.put("transaction", intent.getId().toString());
            row.put("state", state);
            row.put("reason", null);
            transactions.add(row);
        }
        return ok(id, Map.of("transactions", transactions));
    }

    private Map<String, Object> createdResult(Object id, BillingPaymentIntent intent) {
        int state = switch (intent.getStatus()) {
            case PAID -> STATE_DONE;
            case CANCELLED -> intent.getPaidAt() != null ? STATE_CANCELLED_AFTER : STATE_CANCELLED;
            case FAILED -> STATE_CANCELLED;
            default -> STATE_CREATED;
        };
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("create_time", resolveStoredCreateTime(intent));
        result.put("transaction", intent.getId().toString());
        result.put("state", state);
        if (state == STATE_DONE && intent.getPaidAt() != null) {
            result.put("perform_time", intent.getPaidAt().toEpochMilli());
        }
        return ok(id, result);
    }

    /**
     * Payme expects create_time ≈ now at CreateTransaction.
     * Prefer params.time from Payme; fall back to server clock.
     */
    private static long resolveIncomingCreateTime(Map<String, Object> params) {
        Instant fromParams = millisToInstant(params.get("time"));
        if (fromParams != null) {
            return fromParams.toEpochMilli();
        }
        return Instant.now().toEpochMilli();
    }

    /** Stored in providerPrepareId when CreateTransaction succeeds. */
    private static long resolveStoredCreateTime(BillingPaymentIntent intent) {
        String raw = intent.getProviderPrepareId();
        if (StringUtils.hasText(raw)) {
            try {
                return Long.parseLong(raw.trim());
            } catch (NumberFormatException ignored) {
                // fall through
            }
        }
        return intent.getCreatedAt() != null
            ? intent.getCreatedAt().toEpochMilli()
            : Instant.now().toEpochMilli();
    }

    private BillingPaymentIntent findByPaymeId(String paymeId) {
        return intentRepository
            .findByProviderAndProviderTransId(BillingPaymentProvider.PAYME, paymeId)
            .orElseGet(() -> {
                UUID maybe = parseUuid(paymeId);
                return maybe == null ? null : intentRepository.findById(maybe).orElse(null);
            });
    }

    private static String paymeId(Map<String, Object> params) {
        Object raw = params.get("id");
        if (raw == null) {
            return null;
        }
        String value = String.valueOf(raw).trim();
        if (value.isEmpty() || "null".equals(value)) {
            return null;
        }
        return value;
    }

    /** Payme amount is in tiyin; null if missing or not positive. */
    private static Long requirePositiveTiyin(Object raw) {
        BigDecimal amount = toDecimal(raw);
        if (amount == null || amount.signum() <= 0) {
            return null;
        }
        try {
            return amount.longValueExact();
        } catch (ArithmeticException e) {
            return null;
        }
    }

    private static BigDecimal fromTiyin(long amountTiyin) {
        return BigDecimal.valueOf(amountTiyin).movePointLeft(2).setScale(2, java.math.RoundingMode.HALF_UP);
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

    private static Map<String, Object> ok(Object id, Map<String, Object> result) {
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("jsonrpc", "2.0");
        resp.put("id", id);
        resp.put("result", result);
        return resp;
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

    private static Instant millisToInstant(Object raw) {
        if (raw == null) {
            return null;
        }
        try {
            long ms = Long.parseLong(String.valueOf(raw).trim());
            return Instant.ofEpochMilli(ms);
        } catch (Exception e) {
            return null;
        }
    }
}
